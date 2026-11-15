import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { USER_ROLES, canAccessWriterDesk } from '@/lib/db/schema';
import type { UserRole } from '@/lib/db/types';
import { getUserById } from '@/lib/db/queries/users';
import { formatDbError } from '@/lib/db/formatDbError';

/**
 * Resolves the authenticated user, profile (including the legacy `rol` alias),
 * and role, preferring the JWT role over the profile role and then `reader`.
 * A profile query error can leave the user authenticated with a null profile;
 * a missing session, auth error, or thrown exception returns all three as null.
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      if (userError && userError.message !== 'Auth session missing!') {
        console.warn('[Auth] getUser error:', formatDbError(userError));
      }
      return { user: null, profile: null, role: null };
    }

    // 1. Check if role is embedded directly in JWT app_metadata (from custom_access_token_hook)
    const jwtRole = user.app_metadata?.user_role as UserRole | undefined;

    // 2. Fetch user profile via DAL
    const userProfile = await getUserById(user.id, supabase);
    const role: UserRole = userProfile?.role || jwtRole || USER_ROLES.READER;

    // Support backwards-compatibility property .rol on profile if accessed
    const compatProfile = userProfile ? {
      ...userProfile,
      rol: userProfile.role,
    } : null;

    return { user, profile: compatProfile, role };
  } catch (err) {
    console.warn('[Auth] Unexpected error resolving authenticated user:', formatDbError(err));
    return { user: null, profile: null, role: null };
  }
}

/**
 * Resolves the public request origin behind reverse proxies (e.g., Cloudflare Tunnel).
 */
export function resolveRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  return forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin;
}

/**
 * Resolves the destination path inside the desk after OAuth/OTP authentication.
 */
export async function resolvePostAuthRedirectPath(
  user: { id: string; app_metadata?: Record<string, unknown> },
  supabase: SupabaseClient
): Promise<string> {
  const jwtRole = user.app_metadata?.user_role as string | undefined;
  const profile = await getUserById(user.id, supabase);
  const role = profile?.role || jwtRole || USER_ROLES.READER;
  return canAccessWriterDesk(role) ? '/escritorio' : '/escritorio/perfil';
}
