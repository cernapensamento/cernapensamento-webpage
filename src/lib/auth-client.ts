import type { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, USER_COLS, USER_ROLES } from '@/lib/db/schema';
import type { AuthProfile, UserRole } from '@/lib/db/types';

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
