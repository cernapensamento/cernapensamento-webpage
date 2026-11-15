import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates an anonymous, cookie-free Supabase client for public ISR/sitemap queries.
 * Returns undefined if public Supabase credentials are not configured.
 */
export function createPublicAnonClient(): SupabaseClient | undefined {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return undefined;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
