/**
 * Publications Data Access Queries
 * Strongly typed queries for articles, essays, and stories.
 * Enforces bandwidth egress guardrails (never selects full content on listing queries).
 */

import { createClient as createServerClient } from '@/utils/supabase/server';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import {
  DB_TABLES,
  PUBLICATION_COLS,
  USER_COLS,
  PUBLICATION_STATUSES,
} from '../schema';
import type {
  PublicationRow,
  PublicationCardItem,
  PublicationDetail,
  PublicationType,
  PublicationStatus,
  TagItem,
  LocalizedString,
} from '../types';

interface RawTagRelation {
  tag?: {
    id: string;
    slug: string;
    translations?: Array<{ lang: string; name: string }>;
    tag_translations?: Array<{ lang: string; name: string }>;
  } | null;
  tags?: {
    id: string;
    slug: string;
    translations?: Array<{ lang: string; name: string }>;
    tag_translations?: Array<{ lang: string; name: string }>;
  } | null;
}

interface RawPublicationCard {
  id: string;
  slug: string;
  title: LocalizedString;
  subtitle: LocalizedString | null;
  cover_image_url: string | null;
  type: PublicationType;
  status: PublicationStatus;
  is_pinned: boolean | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  author: {
    id: string;
    full_name: string;
    slug: string | null;
    avatar_url: string | null;
  } | null;
  publication_tags: RawTagRelation[] | null;
}

async function resolveClient(provided?: SupabaseClient): Promise<SupabaseClient> {
  if (provided) return provided;
  return await createServerClient();
}

/**
 * Normalizes raw PostgREST publication_tags join into a clean TagItem array.
 */
function normalizeTags(
  rawPublicationTags: unknown,
  preferredLang: string = 'gl'
): TagItem[] {
  if (!Array.isArray(rawPublicationTags)) return [];

  const list = rawPublicationTags as RawTagRelation[];

  return list
    .map((pt) => {
      const tag = pt.tag || pt.tags;
      if (!tag) return null;

      const slug = tag.slug;
      const translations = tag.translations || tag.tag_translations || [];

      let name = slug;
      if (translations.length > 0) {
        const matching = translations.find((t) => t.lang === preferredLang);
        name = matching?.name || translations[0]?.name || slug;
      }

      return {
        id: tag.id,
        slug,
        name,
      };
    })
    .filter((t): t is TagItem => t !== null);
}

/**
 * Fetch a single publication with full TipTap content, author details, and tags.
 * Used exclusively on the reader page (/articulo/[slug]).
 */
export async function getPublicationBySlug(
  slugOrId: string,
  options?: { client?: SupabaseClient; lang?: string }
): Promise<PublicationDetail | null> {
  const supabase = await resolveClient(options?.client);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
  const columnKey = isUUID ? PUBLICATION_COLS.ID : PUBLICATION_COLS.SLUG;

  const { data, error } = await supabase
    .from(DB_TABLES.PUBLICATIONS)
    .select(`
      *,
      author:${DB_TABLES.USERS} (
        ${USER_COLS.ID},
        ${USER_COLS.FULL_NAME},
        ${USER_COLS.SLUG},
        ${USER_COLS.AVATAR_URL},
        ${USER_COLS.BIO}
      ),
      publication_tags (
        tag:${DB_TABLES.TAGS} (
          id, slug,
          translations:${DB_TABLES.TAG_TRANSLATIONS} (lang, name)
        )
      )
    `)
    .eq(columnKey, slugOrId)
    .single();

  if (error || !data) {
    return null;
  }

  const normalizedAuthor = data.author || {
    id: data.author_id,
    full_name: 'Anónimo',
    slug: null,
    avatar_url: null,
    bio: null,
  };

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle,
    content: data.content,
    cover_image_url: data.cover_image_url,
    type: data.type,
    status: data.status,
    original_language: data.original_language,
    is_pinned: data.is_pinned ?? false,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author: normalizedAuthor,
    tags: normalizeTags(data.publication_tags, options?.lang),
  };
}

/**
 * Fetch lightweight publication card items for listings, archive, and feeds.
 * GUARDS AGAINST EGRESS: Excludes heavy content fields!
 */
export async function getPublicationCards(
  options?: {
    limit?: number;
    offset?: number;
    type?: PublicationType;
    status?: PublicationStatus;
    authorId?: string;
    isPinned?: boolean;
    tagSlug?: string;
    client?: SupabaseClient;
    lang?: string;
  }
): Promise<PublicationCardItem[]> {
  const supabase = await resolveClient(options?.client);
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const status = options?.status ?? PUBLICATION_STATUSES.PUBLISHED;

  let query = supabase
    .from(DB_TABLES.PUBLICATIONS)
    .select(`
      ${PUBLICATION_COLS.ID},
      ${PUBLICATION_COLS.SLUG},
      ${PUBLICATION_COLS.TITLE},
      ${PUBLICATION_COLS.SUBTITLE},
      ${PUBLICATION_COLS.COVER_IMAGE_URL},
      ${PUBLICATION_COLS.TYPE},
      ${PUBLICATION_COLS.STATUS},
      ${PUBLICATION_COLS.IS_PINNED},
      ${PUBLICATION_COLS.CREATED_AT},
      ${PUBLICATION_COLS.UPDATED_AT},
      author:${DB_TABLES.USERS} (
        ${USER_COLS.ID},
        ${USER_COLS.FULL_NAME},
        ${USER_COLS.SLUG},
        ${USER_COLS.AVATAR_URL}
      ),
      publication_tags (
        tag:${DB_TABLES.TAGS} (
          id, slug,
          translations:${DB_TABLES.TAG_TRANSLATIONS} (lang, name)
        )
      )
    `)
    .eq(PUBLICATION_COLS.STATUS, status)
    .order(PUBLICATION_COLS.CREATED_AT, { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.type) {
    query = query.eq(PUBLICATION_COLS.TYPE, options.type);
  }
  if (options?.authorId) {
    query = query.eq(PUBLICATION_COLS.AUTHOR_ID, options.authorId);
  }
  if (options?.isPinned !== undefined) {
    query = query.eq(PUBLICATION_COLS.IS_PINNED, options.isPinned);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching publication cards:', error);
    return [];
  }

  const rawCards = data as unknown as RawPublicationCard[];

  return rawCards.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    cover_image_url: row.cover_image_url,
    type: row.type,
    status: row.status,
    is_pinned: row.is_pinned ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author || {
      id: row.author_id,
      full_name: 'Anónimo',
      slug: null,
      avatar_url: null,
    },
    tags: normalizeTags(row.publication_tags, options?.lang),
  }));
}

/**
 * Fetch the featured publication for the homepage hero.
 * Prefers pinned items, falling back to the most recent published publication.
 */
export async function getFeaturedPublication(
  client?: SupabaseClient,
  lang?: string
): Promise<PublicationCardItem | null> {
  const pinned = await getPublicationCards({
    isPinned: true,
    limit: 1,
    client,
    lang,
  });

  if (pinned.length > 0) {
    return pinned[0];
  }

  const latest = await getPublicationCards({
    limit: 1,
    client,
    lang,
  });

  return latest[0] || null;
}

/**
 * Fetch pinned publications for the homepage sidebar/panel.
 */
export async function getPinnedPublications(
  limit: number = 4,
  client?: SupabaseClient,
  lang?: string
): Promise<PublicationCardItem[]> {
  return await getPublicationCards({
    isPinned: true,
    limit,
    client,
    lang,
  });
}

/**
 * Fetch latest published publications for homepage and feeds.
 */
export async function getLatestPublications(
  limit: number = 10,
  client?: SupabaseClient,
  lang?: string
): Promise<PublicationCardItem[]> {
  return await getPublicationCards({
    limit,
    client,
    lang,
  });
}

/**
 * Create a new publication row.
 */
export async function createPublication(
  payload: Partial<PublicationRow>,
  client?: SupabaseClient
): Promise<{ data: PublicationRow | null; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from(DB_TABLES.PUBLICATIONS)
    .insert(payload)
    .select()
    .single();

  return { data: (data as PublicationRow) || null, error };
}

/**
 * Update an existing publication row.
 */
export async function updatePublication(
  id: string,
  payload: Partial<PublicationRow>,
  client?: SupabaseClient
): Promise<{ data: PublicationRow | null; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from(DB_TABLES.PUBLICATIONS)
    .update(payload)
    .eq(PUBLICATION_COLS.ID, id)
    .select()
    .single();

  return { data: (data as PublicationRow) || null, error };
}

/**
 * Update publication publishing status.
 */
export async function updatePublicationStatus(
  id: string,
  status: PublicationStatus,
  client?: SupabaseClient
): Promise<{ success: boolean; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);
  const { error } = await supabase
    .from(DB_TABLES.PUBLICATIONS)
    .update({ [PUBLICATION_COLS.STATUS]: status })
    .eq(PUBLICATION_COLS.ID, id);

  return { success: !error, error };
}

/**
 * Delete a publication.
 */
export async function deletePublication(
  id: string,
  client?: SupabaseClient
): Promise<{ success: boolean; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);
  const { error } = await supabase
    .from(DB_TABLES.PUBLICATIONS)
    .delete()
    .eq(PUBLICATION_COLS.ID, id);

  return { success: !error, error };
}
