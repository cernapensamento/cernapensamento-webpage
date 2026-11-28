'use client';

import { createContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { AuthProfile } from '@/lib/db/types';
import { fetchClientAuthProfile } from '@/lib/auth-client';

export type Profile = AuthProfile | null;

export interface AuthContextValue {
  user: User | null;
  profile: Profile;
  loading: boolean;
}

const defaultAuthContext: AuthContextValue = {
  user: null,
  profile: null,
  loading: false,
};

export const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Single source of truth for browser session and user profile.
 * Loads session once at root layout level and broadcasts updates to all useAuth consumers.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let isMounted = true;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    async function fetchUserProfile(userId: string) {
      const data = await fetchClientAuthProfile(userId, supabase);
      if (isMounted) {
        setProfile(data);
      }
    }

    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          fetchUserProfile(session.user.id);
        }
      } catch {
        // Silent fallback: user remains null
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
        // Defer fetch to avoid deadlock
        setTimeout(() => {
          fetchUserProfile(session.user.id);
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
          fetchUserProfile(session.user.id);
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

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
