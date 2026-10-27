/**
 * Composite Cross-Table Queries
 * Optimized aggregates for multi-section layouts (e.g. Homepage).
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PublicationCardItem,
  ColumnistItem,
} from '../types';
import {
  getFeaturedPublication,
  getPinnedPublications,
  getLatestPublications,
} from './publications';
import { getColumnists } from './users';
import { formatDbError } from '../formatDbError';

async function resolveClient(provided?: SupabaseClient): Promise<SupabaseClient> {
  if (provided) return provided;
  return await createServerClient();
}

export interface HomepageData {
  featured: PublicationCardItem | null;
  pinned: PublicationCardItem[];
  latest: PublicationCardItem[];
  columnists: ColumnistItem[];
}

/**
 * Fetch all data required for the homepage in parallel.
 * Prevents waterfall network bottlenecks.
 */
export async function getHomepageData(options?: {
  lang?: string;
  client?: SupabaseClient;
}): Promise<HomepageData> {
  try {
    const supabase = await resolveClient(options?.client);
    const lang = options?.lang || 'gl';

    const [featured, pinned, latest, columnists] = await Promise.all([
      getFeaturedPublication(supabase, lang),
      getPinnedPublications(4, supabase, lang),
      getLatestPublications(12, supabase, lang),
      getColumnists(supabase),
    ]);

    return {
      featured,
      pinned,
      latest,
      columnists,
    };
  } catch (err) {
    console.warn('[DAL:composite] Unexpected error fetching homepage data:', formatDbError(err));
    return {
      featured: null,
      pinned: [],
      latest: [],
      columnists: [],
    };
  }
}
