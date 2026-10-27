/**
 * Tags Data Access Queries
 * Typed queries for topic taxonomies and translations.
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import {
  DB_TABLES,
  TAG_COLS,
  TAG_TRANSLATION_COLS,
  PUBLICATION_TAG_COLS,
} from '../schema';
import type { TagItem } from '../types';
import { formatDbError } from '../formatDbError';

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
 * Fetch tags ordered by slug, using the requested language (default `gl`), then
 * the first available translation, then the slug as the display name.
 * Query errors and caught exceptions return an empty array. Uses the supplied
 * client or a request-bound server client.
 */
export async function getAllTagsWithTranslations(
  options?: { lang?: string; client?: SupabaseClient }
): Promise<TagItem[]> {
  try {
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
      console.warn('[DAL:tags] Failed to fetch tags:', formatDbError(error));
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
  } catch (err) {
    console.warn('[DAL:tags] Unexpected error fetching tags:', formatDbError(err));
    return [];
  }
}

/**
 * Replace a publication's tag links, or clear them when `tagIds` is empty.
 * Deletion and insertion are separate operations: an insertion failure leaves
 * previous links removed. Query errors and caught exceptions are returned as
 * `success: false` with the error. Uses the supplied client or a server client.
 */
export async function setPublicationTags(
  publicationId: string,
  tagIds: string[],
  client?: SupabaseClient
): Promise<{ success: boolean; error: PostgrestError | null }> {
  try {
    const supabase = await resolveClient(client);

    // 1. Remove existing tag links
    const { error: deleteError } = await supabase
      .from(DB_TABLES.PUBLICATION_TAGS)
      .delete()
      .eq(PUBLICATION_TAG_COLS.PUBLICATION_ID, publicationId);

    if (deleteError) {
      console.warn('[DAL:tags] Failed to delete existing publication tags:', formatDbError(deleteError));
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

    if (insertError) {
      console.warn('[DAL:tags] Failed to insert publication tags:', formatDbError(insertError));
    }

    return { success: !insertError, error: insertError };
  } catch (err) {
    console.warn('[DAL:tags] Unexpected error setting publication tags:', formatDbError(err));
    return { success: false, error: err as PostgrestError };
  }
}

/**
 * Fetch distinct publication IDs matching any supplied tag slug.
 * Empty input, no matches, query errors, and caught exceptions return an empty
 * array. Uses the supplied client or a request-bound server client.
 */
export async function getPublicationIdsByTagSlugs(
  tagSlugs: string[],
  client?: SupabaseClient
): Promise<string[]> {
  try {
    const supabase = await resolveClient(client);
    if (!tagSlugs || tagSlugs.length === 0) return [];

    const { data: tagRows, error: tagError } = await supabase
      .from(DB_TABLES.TAGS)
      .select(TAG_COLS.ID)
      .in(TAG_COLS.SLUG, tagSlugs);

    if (tagError || !tagRows || tagRows.length === 0) {
      if (tagError) {
        console.warn('[DAL:tags] Failed to fetch tag IDs by slugs:', formatDbError(tagError));
      }
      return [];
    }
    const tagIds = tagRows.map((t) => t.id);

    const { data: pubTags, error: pubTagsError } = await supabase
      .from(DB_TABLES.PUBLICATION_TAGS)
      .select(PUBLICATION_TAG_COLS.PUBLICATION_ID)
      .in(PUBLICATION_TAG_COLS.TAG_ID, tagIds);

    if (pubTagsError || !pubTags || pubTags.length === 0) {
      if (pubTagsError) {
        console.warn('[DAL:tags] Failed to fetch publication IDs for tags:', formatDbError(pubTagsError));
      }
      return [];
    }
    return Array.from(new Set(pubTags.map((pt) => pt.publication_id)));
  } catch (err) {
    console.warn('[DAL:tags] Unexpected error in getPublicationIdsByTagSlugs:', formatDbError(err));
    return [];
  }
}
