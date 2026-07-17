'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

type Profile = {
  rol: string;
  avatar_url: string;
} | null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        if (session?.user) {
          setUser(session.user);
          // Don't await here to avoid deadlock
          supabase.from('perfiles').select('rol, avatar_url').eq('id', session.user.id).single()
            .then(({ data }) => {
              if (isMounted) setProfile(data);
            });
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
        // Defer the fetch to avoid lock deadlocks
        setTimeout(() => {
          supabase.from('perfiles').select('rol, avatar_url').eq('id', session.user.id).single()
            .then(({ data }) => {
              if (isMounted) setProfile(data);
            });
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
