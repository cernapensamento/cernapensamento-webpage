import type { SupabaseClient } from '@supabase/supabase-js';
import type { Dictionary } from '@/dictionaries/client';
import { resolveLocale } from '@/i18n-config';
import {
  DB_TABLES,
  PERMISSIONS,
  USER_COLS,
  hasPermission,
  resolveLegacyPrimaryRole,
} from '@/lib/db/schema';
import { getUserRolesAndPermissions } from '@/lib/db/queries/users';
import type { AuthProfile } from '@/lib/db/types';

export const MIN_PASSWORD_LENGTH = 6;

/**
 * Fetch minimal auth profile and DB-backed roles/permissions using a client-side Supabase instance.
 * Safe to import in Client Components (does not touch next/headers) and fails closed on empty roles.
 */
export async function fetchClientAuthProfile(
  userId: string,
  supabase: SupabaseClient
): Promise<AuthProfile | null> {
  try {
    const [{ data, error }, { roles, permissions }] = await Promise.all([
      supabase
        .from(DB_TABLES.USERS)
        .select(`${USER_COLS.AVATAR_URL}, ${USER_COLS.FULL_NAME}`)
        .eq(USER_COLS.ID, userId)
        .single(),
      getUserRolesAndPermissions(userId, supabase),
    ]);

    if (error || !data) {
      return null;
    }

    const role = resolveLegacyPrimaryRole(roles);

    return {
      roles,
      permissions,
      role,
      rol: role,
      avatar_url: data.avatar_url ?? null,
      full_name: data.full_name || null,
    };
  } catch {
    return null;
  }
}

/**
 * Resolves the localized desk destination path after client-side sign-in
 * using DB-backed permissions (no JWT app_metadata fallback).
 */
export async function resolveClientDeskRedirectPath(
  user: { id: string; app_metadata?: Record<string, unknown> },
  supabase: SupabaseClient,
  lang: string
): Promise<string> {
  const locale = resolveLocale(lang);
  const profile = await fetchClientAuthProfile(user.id, supabase);
  return hasPermission(profile?.permissions, PERMISSIONS.DESK_ACCESS)
    ? `/${locale}/escritorio`
    : `/${locale}/escritorio/perfil`;
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
