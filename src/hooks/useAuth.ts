'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { DB_TABLES, USER_COLS } from '@/lib/db/schema';
import type { UserRole } from '@/lib/db/types';
import { formatDbError } from '@/lib/db/formatDbError';

export type Profile = {
  role: UserRole;
  avatar_url: string | null;
  full_name?: string | null;
  // Backwards compatibility alias
  rol: string;
  nombre?: string | null;
} | null;

const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Tracks the browser session and asynchronously loads its profile, including
 * legacy `rol` and `nombre` aliases. Session loading can finish before the
 * profile request completes. Auth changes and `profile_updated` refresh state;
 * subscriptions are removed on unmount. Without Supabase configuration, returns
 * null user/profile with loading false and makes no auth requests.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    let isMounted = true;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch (err) {
      console.warn('[useAuth] Supabase client initialization skipped:', err);
      return;
    }

    async function fetchUserProfile(userId: string, jwtRole?: string) {
      try {
        const { data } = await supabase
          .from(DB_TABLES.USERS)
          .select(`${USER_COLS.ROLE}, ${USER_COLS.AVATAR_URL}, ${USER_COLS.FULL_NAME}`)
          .eq(USER_COLS.ID, userId)
          .single();

        if (isMounted && data) {
          const role = (data.role || jwtRole || 'reader') as UserRole;
          setProfile({
            role,
            avatar_url: data.avatar_url,
            full_name: data.full_name || null,
            rol: role,
            nombre: data.full_name || null,
          });
        }
      } catch (err) {
        console.warn('[useAuth] Failed to fetch user profile:', formatDbError(err));
      }
    }

    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        if (session?.user) {
          setUser(session.user);
          const jwtRole = session.user.app_metadata?.user_role as string | undefined;
          fetchUserProfile(session.user.id, jwtRole);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'INITIAL_SESSION') return;
      
      if (session?.user) {
        setUser(session.user);
        const jwtRole = session.user.app_metadata?.user_role as string | undefined;
        // Defer fetch to avoid deadlock
        setTimeout(() => {
          fetchUserProfile(session.user.id, jwtRole);
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
      }
      if (isMounted) setLoading(false);
    });

    const handleProfileUpdated = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const jwtRole = session.user.app_metadata?.user_role as string | undefined;
          fetchUserProfile(session.user.id, jwtRole);
        }
      });
    };

    window.addEventListener('profile_updated', handleProfileUpdated);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('profile_updated', handleProfileUpdated);
    };
  }, []);

  return { user, profile, loading };
}
