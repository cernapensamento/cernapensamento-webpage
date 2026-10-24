import { createClient } from '@/lib/supabase/server';
import { DB_TABLES, USER_COLS } from '@/lib/db/schema';
import type { UserRow, UserRole } from '@/lib/db/types';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { user: null, profile: null, role: null };
  }

  // 1. Check if role is embedded directly in JWT app_metadata (from custom_access_token_hook)
  const jwtRole = user.app_metadata?.user_role as UserRole | undefined;
  
  // 2. Fetch user profile from public.users
  const { data: profile } = await supabase
    .from(DB_TABLES.USERS)
    .select('*')
    .eq(USER_COLS.ID, user.id)
    .single();

  const userProfile = profile as UserRow | null;
  const role: UserRole = jwtRole || userProfile?.role || 'reader';

  // Support backwards-compatibility property .rol on profile if accessed
  const compatProfile = userProfile ? {
    ...userProfile,
    rol: userProfile.role,
  } : null;

  return { user, profile: compatProfile, role };
}
