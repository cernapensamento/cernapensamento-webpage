'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { DB_TABLES, USER_COLS } from '@/lib/db/schema';
import type { UserRole } from '@/lib/db/types';

export type Profile = {
  role: UserRole;
  avatar_url: string | null;
  // Backwards compatibility alias
  rol: string;
} | null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchUserProfile(userId: string, jwtRole?: string) {
      try {
        const { data } = await supabase
          .from(DB_TABLES.USERS)
          .select(`${USER_COLS.ROLE}, ${USER_COLS.AVATAR_URL}`)
          .eq(USER_COLS.ID, userId)
          .single();

        if (isMounted && data) {
          const role = (data.role || jwtRole || 'reader') as UserRole;
          setProfile({
            role,
            avatar_url: data.avatar_url,
            rol: role,
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
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
