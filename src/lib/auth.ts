import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js';
import {
  PERMISSIONS,
  hasPermission,
  resolveLegacyPrimaryRole,
} from '@/lib/db/schema';
import type { PermissionValue, ProfileRow, UserRole } from '@/lib/db/types';
import { getUserById, getUserRolesAndPermissions } from '@/lib/db/queries/users';
import { formatDbError } from '@/lib/db/formatDbError';
import { isSupportedLocale, resolveLocale, type Locale } from '@/i18n-config';

const VALID_EMAIL_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

/**
 * Resolves the authenticated user, profile, assigned DB roles, and effective atomic
 * permissions directly from the database (no JWT `app_metadata` fallback).
 * Fails closed to empty roles and zero permissions when a user has no rows in `user_roles`.
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      if (userError && userError.message !== 'Auth session missing!') {
        console.warn('[Auth] getUser error:', formatDbError(userError));
      }
      return {
        user: null,
        profile: null,
        roles: [] as UserRole[],
        permissions: [] as PermissionValue[],
        role: null,
      };
    }

    const [userProfile, { roles, permissions }] = await Promise.all([
      getUserById(user.id, supabase),
      getUserRolesAndPermissions(user.id, supabase),
    ]);

    const role: UserRole = resolveLegacyPrimaryRole(roles);

    const compatProfile: ProfileRow | null = userProfile
      ? {
          ...userProfile,
          roles,
          permissions,
          role,
          rol: role,
        }
      : null;

    return { user, profile: compatProfile, roles, permissions, role };
  } catch (err) {
    console.warn('[Auth] Unexpected error resolving authenticated user:', formatDbError(err));
    return {
      user: null,
      profile: null,
      roles: [] as UserRole[],
      permissions: [] as PermissionValue[],
      role: null,
    };
  }
}

/**
 * Resolves the public request origin behind reverse proxies (e.g., Cloudflare Tunnel).
 */
export function resolveRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  return forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin;
}

/**
 * Validates that a redirect target is a safe same-origin relative path.
 */
export function isSafeRedirectPath(next: string | null, origin: string): next is string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return false;
  }
  try {
    return new URL(next, origin).origin === origin;
  } catch {
    return false;
  }
}

/**
 * Type guard validating external OTP type parameters.
 */
export function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && VALID_EMAIL_OTP_TYPES.has(value as EmailOtpType);
}

/**
 * Resolves active locale for non-localized auth callback routes from `lang`
 * query param, `next` path prefix, `NEXT_LOCALE` cookie, or `i18n.defaultLocale`.
 */
export function resolveRequestLocale(request: Request): Locale {
  const { searchParams } = new URL(request.url);
  const queryLang = searchParams.get('lang');
  if (isSupportedLocale(queryLang)) {
    return queryLang;
  }

  const next = searchParams.get('next');
  const nextSegment = next?.startsWith('/') ? next.split('/')[1] : undefined;
  if (isSupportedLocale(nextSegment)) {
    return nextSegment;
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const cookieLang = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return resolveLocale(cookieLang);
}

/**
 * Resolves the localized destination path inside the desk after OAuth/OTP authentication.
 */
export async function resolvePostAuthRedirectPath(
  user: { id: string; app_metadata?: Record<string, unknown> },
  supabase: SupabaseClient,
  lang?: string
): Promise<string> {
  const locale = resolveLocale(lang);
  const { permissions } = await getUserRolesAndPermissions(user.id, supabase);
  return hasPermission(permissions, PERMISSIONS.DESK_ACCESS)
    ? `/${locale}/escritorio`
    : `/${locale}/escritorio/perfil`;
}

/**
 * Handles OAuth / PKCE code exchange and returns the validated destination URL.
 */
export async function handleAuthCodeCallback(request: Request): Promise<string> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const origin = resolveRequestOrigin(request);
  const locale = resolveRequestLocale(request);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (isSafeRedirectPath(next, origin)) {
        return `${origin}${next}`;
      }

      const redirectPath = await resolvePostAuthRedirectPath(data.user, supabase, locale);
      return `${origin}${redirectPath}`;
    }
  }

  return `${origin}/${locale}/login?error=auth_failed`;
}

/**
 * Handles email OTP confirmation / recovery verification and returns the destination URL.
 */
export async function handleAuthConfirmCallback(request: Request): Promise<string> {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const rawType = searchParams.get('type');
  const type = isEmailOtpType(rawType) ? rawType : null;
  const next = searchParams.get('next');
  const origin = resolveRequestOrigin(request);
  const locale = resolveRequestLocale(request);

  const supabase = await createClient();

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      if (isSafeRedirectPath(next, origin)) {
        return `${origin}${next}`;
      }

      const verifiedUser = data?.user ?? (await supabase.auth.getUser()).data.user;
      if (verifiedUser) {
        const redirectPath = await resolvePostAuthRedirectPath(verifiedUser, supabase, locale);
        return `${origin}${redirectPath}`;
      }
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const redirectPath = await resolvePostAuthRedirectPath(user, supabase, locale);
    return `${origin}${redirectPath}`;
  }

  return `${origin}/${locale}/login?error=auth_failed`;
}
