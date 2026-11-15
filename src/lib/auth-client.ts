import type { SupabaseClient } from '@supabase/supabase-js';
import type { Dictionary } from '@/dictionaries/client';
import { resolveLocale } from '@/i18n-config';
import { DB_TABLES, USER_COLS, USER_ROLES, canAccessWriterDesk } from '@/lib/db/schema';
import type { AuthProfile, UserRole } from '@/lib/db/types';

export const MIN_PASSWORD_LENGTH = 6;

/**
 * Fetch minimal auth profile directly using a client-side Supabase instance.
 * Safe to import in Client Components (does not touch next/headers).
 */
export async function fetchClientAuthProfile(
  userId: string,
  supabase: SupabaseClient
): Promise<AuthProfile | null> {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.USERS)
      .select(`${USER_COLS.ROLE}, ${USER_COLS.AVATAR_URL}, ${USER_COLS.FULL_NAME}`)
      .eq(USER_COLS.ID, userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      role: (data.role || USER_ROLES.READER) as UserRole,
      avatar_url: data.avatar_url,
      full_name: data.full_name || null,
    };
  } catch {
    return null;
  }
}

/**
 * Resolves the localized desk destination path after client-side sign-in.
 */
export async function resolveClientDeskRedirectPath(
  user: { id: string; app_metadata?: Record<string, unknown> },
  supabase: SupabaseClient,
  lang: string
): Promise<string> {
  const locale = resolveLocale(lang);
  const jwtRole = user.app_metadata?.user_role as string | undefined;
  const profile = await fetchClientAuthProfile(user.id, supabase);
  const role = profile?.role || jwtRole || USER_ROLES.READER;
  return canAccessWriterDesk(role) ? `/${locale}/escritorio` : `/${locale}/escritorio/perfil`;
}

/**
 * Builds a locale-aware auth callback URL preserving optional next path.
 */
export function buildAuthCallbackUrl(origin: string, lang: string, nextPath?: string): string {
  const locale = resolveLocale(lang);
  const params = new URLSearchParams({ lang: locale });
  if (nextPath) {
    params.set('next', nextPath);
  }
  return `${origin}/auth/callback?${params.toString()}`;
}

export interface FormattedAuthError {
  message: string;
  isUnconfirmedEmail: boolean;
}

/**
 * Maps Supabase Auth errors onto localized dictionary strings without exposing
 * raw English provider strings when known patterns apply.
 */
export function formatClientAuthError(
  err: unknown,
  loginDict: Dictionary['loginPage'],
  fallback: string = loginDict.genericAuthError
): string {
  const raw = err instanceof Error ? err.message.toLowerCase() : '';
  if (raw.includes('email not confirmed')) {
    return loginDict.unconfirmedEmail;
  }
  if (raw.includes('user already registered')) {
    return loginDict.userAlreadyExists;
  }
  if (raw.includes('invalid login credentials') || raw.includes('invalid_credentials')) {
    return fallback;
  }
  return fallback;
}

export function isUnconfirmedEmailError(err: unknown): boolean {
  return err instanceof Error && err.message.toLowerCase().includes('email not confirmed');
}

export function signInWithGoogleOAuth(supabase: SupabaseClient, redirectTo: string) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

export function signInWithGoogleIdToken(supabase: SupabaseClient, token: string) {
  return supabase.auth.signInWithIdToken({
    provider: 'google',
    token,
  });
}

export function signInWithEmailPassword(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signUpWithEmailPassword(
  supabase: SupabaseClient,
  email: string,
  password: string,
  fullName: string,
  emailRedirectTo: string
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        [USER_COLS.FULL_NAME]: fullName,
        nombre: fullName,
      },
      emailRedirectTo,
    },
  });
}

export function resendSignupConfirmationEmail(
  supabase: SupabaseClient,
  email: string,
  emailRedirectTo: string
) {
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo },
  });
}

export function sendPasswordResetEmail(
  supabase: SupabaseClient,
  email: string,
  redirectTo: string
) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

export function getClientSession(supabase: SupabaseClient) {
  return supabase.auth.getSession();
}

export function updateClientPassword(supabase: SupabaseClient, password: string) {
  return supabase.auth.updateUser({ password });
}
