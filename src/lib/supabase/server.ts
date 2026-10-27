import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client bound to the current request's cookies, using
 * placeholder URL/key values when public configuration is missing.
 * Cookie write failures are ignored; cookie access and client initialization
 * errors propagate to the caller.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Se ignora el error si se llama desde un Server Component
            // porque el middleware ya se encarga de refrescar las sesiones.
          }
        },
      },
    }
  )
}
