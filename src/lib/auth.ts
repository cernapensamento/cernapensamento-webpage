import { createClient } from '@/lib/supabase/server';
import { DB_TABLES, USER_COLS } from '@/lib/db/schema';
import type { UserRow, UserRole } from '@/lib/db/types';
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

    // 2. Fetch user profile from public.users
    const { data: profile, error: profileError } = await supabase
      .from(DB_TABLES.USERS)
      .select('*')
      .eq(USER_COLS.ID, user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('[Auth] Failed to fetch user profile:', formatDbError(profileError));
    }

    const userProfile = (profile as UserRow | null) || null;
    const role: UserRole = jwtRole || userProfile?.role || 'reader';

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
