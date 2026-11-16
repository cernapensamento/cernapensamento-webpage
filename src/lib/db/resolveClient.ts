import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createDefaultClient } from '#supabase-default-client';

/**
 * Resolves a Supabase client cleanly across both Server Components/Actions and Client Components.
 * Uses `#supabase-default-client` conditional subpath imports (`react-server` -> server.ts, `default` -> client.ts)
 * so Client Component SSR and browser bundles never pull `next/headers`.
 */
export async function resolveClient(provided?: SupabaseClient): Promise<SupabaseClient> {
  if (provided) return provided;
  return await createDefaultClient();
}
