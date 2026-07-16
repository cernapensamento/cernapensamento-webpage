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
    const supabase = createClient();
    let isMounted = true;
    
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (user) {
        setUser(user);
        const { data } = await supabase.from('perfiles').select('rol, avatar_url').eq('id', user.id).single();
        if (isMounted) setProfile(data);
      }
      if (isMounted) setLoading(false);
    }
    
    fetchUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (isMounted) setUser(session.user);
        const { data } = await supabase.from('perfiles').select('rol, avatar_url').eq('id', session.user.id).single();
        if (isMounted) setProfile(data);
      } else {
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
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
