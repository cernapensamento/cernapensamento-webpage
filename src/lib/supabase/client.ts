import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates the browser Supabase client using public environment configuration,
 * with placeholder URL/key values when configuration is missing.
 * Client initialization errors propagate to the caller.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
