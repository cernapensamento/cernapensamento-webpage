/**
 * Tags Data Access Queries
 * Typed queries for topic taxonomies and translations.
 */

import { createClient as createServerClient } from '@/utils/supabase/server';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import {
  DB_TABLES,
  TAG_COLS,
  TAG_TRANSLATION_COLS,
  PUBLICATION_TAG_COLS,
} from '../schema';
import type { TagItem } from '../types';

interface RawTagRow {
  id: string;
  slug: string;
  translations: Array<{
    lang: string;
    name: string;
  }> | null;
}

async function resolveClient(provided?: SupabaseClient): Promise<SupabaseClient> {
  if (provided) return provided;
  return await createServerClient();
}

/**
 * Fetch all available tags with localized names.
 */
export async function getAllTagsWithTranslations(
  options?: { lang?: string; client?: SupabaseClient }
): Promise<TagItem[]> {
  const supabase = await resolveClient(options?.client);
  const preferredLang = options?.lang || 'gl';

  const { data, error } = await supabase
    .from(DB_TABLES.TAGS)
    .select(`
      ${TAG_COLS.ID},
      ${TAG_COLS.SLUG},
      translations:${DB_TABLES.TAG_TRANSLATIONS} (
        ${TAG_TRANSLATION_COLS.LANG},
        ${TAG_TRANSLATION_COLS.NAME}
      )
    `)
    .order(TAG_COLS.SLUG, { ascending: true });

  if (error || !data) {
    console.error('Error fetching tags:', error);
    return [];
  }

  const rawTags = data as unknown as RawTagRow[];

  return rawTags.map((tag) => {
    const translations = tag.translations || [];
    let name = tag.slug;
    if (translations.length > 0) {
      const match = translations.find((t) => t.lang === preferredLang);
      name = match?.name || translations[0]?.name || tag.slug;
    }
    return {
      id: tag.id,
      slug: tag.slug,
      name,
    };
  });
}

/**
 * Set (overwrite) the tags assigned to a publication.
 */
export async function setPublicationTags(
  publicationId: string,
  tagIds: string[],
  client?: SupabaseClient
): Promise<{ success: boolean; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);

  // 1. Remove existing tag links
  const { error: deleteError } = await supabase
    .from(DB_TABLES.PUBLICATION_TAGS)
    .delete()
    .eq(PUBLICATION_TAG_COLS.PUBLICATION_ID, publicationId);

  if (deleteError) {
    return { success: false, error: deleteError };
  }

  // 2. Insert new tag links
  if (tagIds.length === 0) {
    return { success: true, error: null };
  }

  const rows = tagIds.map((tagId) => ({
    [PUBLICATION_TAG_COLS.PUBLICATION_ID]: publicationId,
    [PUBLICATION_TAG_COLS.TAG_ID]: tagId,
  }));

  const { error: insertError } = await supabase
    .from(DB_TABLES.PUBLICATION_TAGS)
    .insert(rows);

  return { success: !insertError, error: insertError };
}
