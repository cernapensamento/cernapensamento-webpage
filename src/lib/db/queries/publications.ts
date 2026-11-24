/**
 * Publications Data Access Queries
 * Strongly typed queries for articles, essays, and stories.
 * Enforces bandwidth egress guardrails (never selects full content on listing queries).
 */

import { resolveClient } from '../resolveClient';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { sanitizeStorageUrl } from '@/lib/storage/paths';
import {
  DB_TABLES,
  PUBLICATION_COLS,
  USER_COLS,
  TAG_COLS,
  TAG_TRANSLATION_COLS,
  PUBLICATION_STATUSES,
  GUEST_PUBLICATION_LIMITS,
} from '../schema';
import { getPublicationIdsByTagSlugs } from './tags';
import { formatDbError, isMissingColumnError } from '../formatDbError';
import type {
  PublicationRow,
  PublicationCardItem,
  PublicationDashboardItem,
  PublicationDetail,
  PublicationType,
  PublicationStatus,
  TagItem,
  LocalizedString,
  GuestPublicationQuota,
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
  original_language?: string | null;
  is_pinned: boolean | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  author_id: string;
  author: {
    id: string;
    full_name: string;
    slug: string | null;
    avatar_url: string | null;
  } | null;
  publication_tags: RawTagRelation[] | null;
}

const PUBLICATION_TAGS_SELECT = `${DB_TABLES.PUBLICATION_TAGS} (
  tag:${DB_TABLES.TAGS} (
    ${TAG_COLS.ID}, ${TAG_COLS.SLUG},
    translations:${DB_TABLES.TAG_TRANSLATIONS} (${TAG_TRANSLATION_COLS.LANG}, ${TAG_TRANSLATION_COLS.NAME})
  )
)` as const;

const PUBLICATION_DETAIL_SELECT = `
  *,
  author:${DB_TABLES.USERS} (
    ${USER_COLS.ID},
    ${USER_COLS.FULL_NAME},
    ${USER_COLS.SLUG},
    ${USER_COLS.AVATAR_URL},
    ${USER_COLS.BIO}
  ),
  ${PUBLICATION_TAGS_SELECT}
` as const;

/**
 * Rewrites the former Supabase image hostname to the current one, or returns
 * null for an empty URL. Delegates to sanitizeStorageUrl.
 */
const cleanImageUrl = sanitizeStorageUrl;

/**
 * Normalizes raw PostgREST publication_tags join into a clean TagItem array.
 */
function normalizeTags(
  rawPublicationTags: unknown,
  preferredLang: string = 'gl'
): TagItem[] {
  if (!Array.isArray(rawPublicationTags)) return [];

  const list = rawPublicationTags as RawTagRelation[];
  const result: TagItem[] = [];

  for (const pt of list) {
    const tag = pt.tag || pt.tags;
    if (!tag) continue;

    const slug = tag.slug;
    const translations = tag.translations || tag.tag_translations || [];

    let name = slug;
    if (translations.length > 0) {
      const matching = translations.find((t) => t.lang === preferredLang);
      name = matching?.name || translations[0]?.name || slug;
    }

    result.push({
      id: tag.id,
      slug,
      name,
    });
  }

  return result;
}

/**
 * Retrieve a full publication detail by its primary UUID.
 */
export async function getPublicationById(
  id: string,
  options?: { client?: SupabaseClient; lang?: string; throwOnError?: boolean }
): Promise<PublicationDetail | null> {
  return await getPublicationBySlug(id, options);
}

/**
 * Fetch a publication by slug or UUID with full content, author details, and tags.
 * An unmatched slug ending in six alphanumeric characters after a hyphen can
 * resolve to the first slug sharing that suffix; the result keeps its current slug.
 * Falls back to legacy articles when the canonical table is missing (without tags).
 * Returns null for no match; failures also return null unless `throwOnError` is set.
 * With `throwOnError`, query failures and exceptions propagate to the caller. Visibility depends
 * on the supplied client or request-bound server client; no status filter is added.
 * `lang` selects tag names, defaulting to `gl`, then the first translation or slug.
 */
export async function getPublicationBySlug(
  slugOrId: string,
  options?: { client?: SupabaseClient; lang?: string; throwOnError?: boolean }
): Promise<PublicationDetail | null> {
  try {
    const supabase = await resolveClient(options?.client);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
    const columnKey = isUUID ? PUBLICATION_COLS.ID : PUBLICATION_COLS.SLUG;
    const suffixMatch = !isUUID ? slugOrId.match(/-([a-z0-9]{6})$/i) : null;
    const suffix = suffixMatch ? suffixMatch[1] : null;

    const { data, error } = await supabase
      .from(DB_TABLES.PUBLICATIONS)
      .select(PUBLICATION_DETAIL_SELECT)
      .eq(columnKey, slugOrId)
      .maybeSingle();

    if (error && error.code !== 'PGRST205') throw error;

    let activeData = data;
    if (!activeData && suffix && error?.code !== 'PGRST205') {
      const { data: suffixData, error: suffixError } = await supabase
        .from(DB_TABLES.PUBLICATIONS)
        .select(PUBLICATION_DETAIL_SELECT)
        .ilike(PUBLICATION_COLS.SLUG, `%-${suffix}`)
        .limit(1)
        .maybeSingle();

      if (suffixError) throw suffixError;
      if (suffixData) {
        activeData = suffixData;
      }
    }

    if (!activeData) {
      if (error?.code === 'PGRST205') {
        // Schema fallback to articulos table
        const legacyCol = isUUID ? 'id' : 'slug';
        const { data: legacyData, error: legacyError } = await supabase
          .from('articulos')
          .select(`
            id, slug, titulo_gl, titulo_es, subtitulo_gl, subtitulo_es, contenido_gl, contenido_es,
            imagen_url, tipo, estado, fijado, idioma_original, creado_en, actualizado_en, autor_id,
            perfiles:autor_id (id, nombre, slug, avatar_url, biografia)
          `)
          .eq(legacyCol, slugOrId)
          .maybeSingle();

        if (legacyError) throw legacyError;

        let activeLegacyData = legacyData;
        if (!activeLegacyData && suffix) {
          const { data: suffixLegacyData, error: suffixLegacyError } = await supabase
            .from('articulos')
            .select(`
              id, slug, titulo_gl, titulo_es, subtitulo_gl, subtitulo_es, contenido_gl, contenido_es,
              imagen_url, tipo, estado, fijado, idioma_original, creado_en, actualizado_en, autor_id,
              perfiles:autor_id (id, nombre, slug, avatar_url, biografia)
            `)
            .ilike('slug', `%-${suffix}`)
            .limit(1)
            .maybeSingle();

          if (suffixLegacyError) throw suffixLegacyError;
          if (suffixLegacyData) {
            activeLegacyData = suffixLegacyData;
          }
        }

        if (!activeLegacyData) {
          return null;
        }

        const pAuthor = (activeLegacyData.perfiles as unknown as { id?: string; nombre?: string; slug?: string; avatar_url?: string; biografia?: string }) || {};

        return {
          id: activeLegacyData.id,
          slug: activeLegacyData.slug,
          title: { gl: activeLegacyData.titulo_gl || '', es: activeLegacyData.titulo_es || '' },
          subtitle: activeLegacyData.subtitulo_gl || activeLegacyData.subtitulo_es ? { gl: activeLegacyData.subtitulo_gl || '', es: activeLegacyData.subtitulo_es || '' } : null,
          content: { gl: activeLegacyData.contenido_gl || '', es: activeLegacyData.contenido_es || '' },
          cover_image_url: cleanImageUrl(activeLegacyData.imagen_url),
          type: (activeLegacyData.tipo === 'ensaio' ? 'essay' : activeLegacyData.tipo === 'noticia' ? 'news' : 'article') as PublicationType,
          status: (activeLegacyData.estado === 'publicado' ? 'published' : 'draft') as PublicationStatus,
          original_language: activeLegacyData.idioma_original || 'gl',
          is_pinned: activeLegacyData.fijado ?? false,
          show_index: false,
          created_at: activeLegacyData.creado_en,
          updated_at: activeLegacyData.actualizado_en,
          published_at: activeLegacyData.creado_en,
          author: {
            id: pAuthor.id || activeLegacyData.autor_id,
            full_name: pAuthor.nombre || 'Anónimo',
            slug: pAuthor.slug || null,
            avatar_url: pAuthor.avatar_url || null,
            bio: pAuthor.biografia ? { gl: pAuthor.biografia, es: pAuthor.biografia } : null,
          },
          tags: [],
        };
      }
      return null;
    }

    const normalizedAuthor = activeData.author || {
      id: activeData.author_id,
      full_name: 'Anónimo',
      slug: null,
      avatar_url: null,
      bio: null,
    };

    return {
      id: activeData.id,
      slug: activeData.slug,
      title: activeData.title,
      subtitle: activeData.subtitle,
      content: activeData.content,
      cover_image_url: cleanImageUrl(activeData.cover_image_url),
      type: activeData.type,
      status: activeData.status,
      original_language: activeData.original_language,
      is_pinned: activeData.is_pinned ?? false,
      show_index: activeData.show_index ?? false,
      created_at: activeData.created_at,
      updated_at: activeData.updated_at,
      published_at: activeData.published_at ?? activeData.created_at,
      author: normalizedAuthor,
      tags: normalizeTags(activeData.publication_tags, options?.lang),
    };
  } catch (err) {
    if (options?.throwOnError) throw err;
    console.warn(`[DAL:publications] Unexpected error fetching publication "${slugOrId}":`, formatDbError(err));
    return null;
  }
}

/**
 * Fetch lightweight publication card items for listings, archive, and feeds.
 * GUARDS AGAINST EGRESS: Excludes heavy content fields!
 */
export interface GetPublicationCardsOptions {
  limit?: number;
  offset?: number;
  type?: PublicationType;
  status?: PublicationStatus;
  authorId?: string;
  isPinned?: boolean;
  tagSlug?: string;
  tagSlugs?: string[];
  searchQuery?: string;
  client?: SupabaseClient;
  lang?: string;
}

function sanitizeSearchQuery(term: string): string {
  return term.replace(/[,().%*"\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function runPublicationCardsQuery(
  supabase: SupabaseClient,
  params: {
    includePublishedAt: boolean;
    limit: number;
    offset: number;
    status: PublicationStatus;
    allowedIds: string[] | null;
    type?: PublicationType;
    authorId?: string;
    isPinned?: boolean;
    searchQuery?: string;
  }
) {
  const selectCols = [
    PUBLICATION_COLS.ID,
    PUBLICATION_COLS.SLUG,
    PUBLICATION_COLS.TITLE,
    PUBLICATION_COLS.SUBTITLE,
    PUBLICATION_COLS.COVER_IMAGE_URL,
    PUBLICATION_COLS.TYPE,
    PUBLICATION_COLS.STATUS,
    PUBLICATION_COLS.ORIGINAL_LANGUAGE,
    PUBLICATION_COLS.IS_PINNED,
    PUBLICATION_COLS.CREATED_AT,
    PUBLICATION_COLS.UPDATED_AT,
    ...(params.includePublishedAt ? [PUBLICATION_COLS.PUBLISHED_AT] : []),
    `author:${DB_TABLES.USERS} (
      ${USER_COLS.ID},
      ${USER_COLS.FULL_NAME},
      ${USER_COLS.SLUG},
      ${USER_COLS.AVATAR_URL}
    )`,
    PUBLICATION_TAGS_SELECT,
  ].join(', ');

  let query = supabase
    .from(DB_TABLES.PUBLICATIONS)
    .select(selectCols)
    .eq(PUBLICATION_COLS.STATUS, params.status);

  if (params.includePublishedAt) {
    query = query.order(PUBLICATION_COLS.PUBLISHED_AT, { ascending: false, nullsFirst: false });
  }

  query = query
    .order(PUBLICATION_COLS.CREATED_AT, { ascending: false })
    .order(PUBLICATION_COLS.ID, { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  if (params.allowedIds !== null) {
    query = query.in(PUBLICATION_COLS.ID, params.allowedIds);
  }
  if (params.type) {
    query = query.eq(PUBLICATION_COLS.TYPE, params.type);
  }
  if (params.authorId) {
    query = query.eq(PUBLICATION_COLS.AUTHOR_ID, params.authorId);
  }
  if (params.isPinned !== undefined) {
    query = query.eq(PUBLICATION_COLS.IS_PINNED, params.isPinned);
  }
  if (params.searchQuery) {
    const q = sanitizeSearchQuery(params.searchQuery);
    if (q) {
      const searchClauses = [
        `${PUBLICATION_COLS.TITLE}->>gl.ilike.%${q}%`,
        `${PUBLICATION_COLS.TITLE}->>es.ilike.%${q}%`,
        `${PUBLICATION_COLS.SUBTITLE}->>gl.ilike.%${q}%`,
        `${PUBLICATION_COLS.SUBTITLE}->>es.ilike.%${q}%`,
      ];
      query = query.or(searchClauses.join(','));
    }
  }

  return await query;
}

/**
 * Fetch lightweight cards without full content, newest creation time first.
 * Defaults to 20 published items at zero-based offset 0. Filters can restrict type,
 * author, pin state, tags, and titles/subtitles in either language (ILIKE patterns).
 * `tagSlug` takes precedence over `tagSlugs`; multiple tags match any supplied slug.
 * `lang` selects tag names, defaulting to `gl`, then the first translation or slug.
 * A missing canonical table triggers legacy lookup, which omits tags and does not
 * apply tag filtering. No matches, query errors, and caught exceptions return [].
 * Uses the supplied client or a request-bound server client.
 */
export async function getPublicationCards(
  options?: GetPublicationCardsOptions
): Promise<PublicationCardItem[]> {
  try {
    const supabase = await resolveClient(options?.client);
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;
    const status = options?.status ?? PUBLICATION_STATUSES.PUBLISHED;

    // Handle tag filtering via junction table
    const tagSlugsFilter = options?.tagSlug
      ? [options.tagSlug]
      : (options?.tagSlugs && options.tagSlugs.length > 0 ? options.tagSlugs : null);

    let allowedIds: string[] | null = null;
    if (tagSlugsFilter && tagSlugsFilter.length > 0) {
      allowedIds = await getPublicationIdsByTagSlugs(tagSlugsFilter, supabase);
      if (allowedIds.length === 0) {
        return [];
      }
    }

    const queryParams = {
      limit,
      offset,
      status,
      allowedIds,
      type: options?.type,
      authorId: options?.authorId,
      isPinned: options?.isPinned,
      searchQuery: options?.searchQuery,
    };

    let { data, error } = await runPublicationCardsQuery(supabase, {
      ...queryParams,
      includePublishedAt: true,
    });

    if (isMissingColumnError(error, PUBLICATION_COLS.PUBLISHED_AT)) {
      ({ data, error } = await runPublicationCardsQuery(supabase, {
        ...queryParams,
        includePublishedAt: false,
      }));
    }
    if (error || !data) {
      if (error?.code === 'PGRST205') {
        let legQuery = supabase
          .from('articulos')
          .select(`
            id, slug, titulo_gl, titulo_es, subtitulo_gl, subtitulo_es, imagen_url, tipo, estado, fijado, creado_en, actualizado_en, autor_id,
            perfiles:autor_id (id, nombre, slug, avatar_url)
          `)
          .order('creado_en', { ascending: false })
          .order('id', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          legQuery = legQuery.eq('estado', status === 'published' ? 'publicado' : status);
        }
        if (options?.type) {
          const legType = options.type === 'essay' ? 'ensaio' : options.type === 'news' ? 'noticia' : 'artigo';
          legQuery = legQuery.eq('tipo', legType);
        }
        if (options?.authorId) {
          legQuery = legQuery.eq('autor_id', options.authorId);
        }
        if (options?.isPinned !== undefined) {
          legQuery = legQuery.eq('fijado', options.isPinned);
        }
        if (options?.searchQuery) {
          const q = sanitizeSearchQuery(options.searchQuery);
          if (q) {
            legQuery = legQuery.or(`titulo_gl.ilike.%${q}%,titulo_es.ilike.%${q}%,subtitulo_gl.ilike.%${q}%,subtitulo_es.ilike.%${q}%`);
          }
        }

        const { data: legData, error: legErr } = await legQuery;
        if (legErr || !legData) {
          console.warn('[DAL:publications] Legacy query error:', formatDbError(legErr));
          return [];
        }

        return legData.map((row) => {
          const pAuthor = (row.perfiles as unknown as { id?: string; nombre?: string; slug?: string; avatar_url?: string }) || {};
          return {
            id: row.id,
            slug: row.slug,
            title: { gl: row.titulo_gl || '', es: row.titulo_es || '' },
            subtitle: row.subtitulo_gl || row.subtitulo_es ? { gl: row.subtitulo_gl || '', es: row.subtitulo_es || '' } : null,
            cover_image_url: cleanImageUrl(row.imagen_url),
            type: (row.tipo === 'ensaio' ? 'essay' : row.tipo === 'noticia' ? 'news' : 'article') as PublicationType,
            status: (row.estado === 'publicado' ? 'published' : 'draft') as PublicationStatus,
            is_pinned: row.fijado ?? false,
            created_at: row.creado_en,
            updated_at: row.actualizado_en,
            published_at: row.creado_en,
            author: {
              id: pAuthor.id || row.autor_id,
              full_name: pAuthor.nombre || 'Anónimo',
              slug: pAuthor.slug || null,
              avatar_url: pAuthor.avatar_url || null,
            },
            tags: [],
          };
        });
      }
      console.warn('[DAL:publications] Failed to fetch publication cards:', formatDbError(error));
      return [];
    }

    const rawCards = data as unknown as RawPublicationCard[];

    return rawCards.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      cover_image_url: cleanImageUrl(row.cover_image_url),
      type: row.type,
      status: row.status,
      original_language: row.original_language || 'gl',
      is_pinned: row.is_pinned ?? false,
      created_at: row.created_at,
      updated_at: row.updated_at,
      published_at: row.published_at ?? row.created_at,
      author: row.author || {
        id: row.author_id,
        full_name: 'Anónimo',
        slug: null,
        avatar_url: null,
      },
      tags: normalizeTags(row.publication_tags, options?.lang),
    }));
  } catch (err) {
    console.warn('[DAL:publications] Unexpected error fetching publication cards:', formatDbError(err));
    return [];
  }
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
  const updatePayload: Record<string, unknown> = {
    [PUBLICATION_COLS.STATUS]: status,
  };
  if (status === PUBLICATION_STATUSES.DRAFT || status === PUBLICATION_STATUSES.IN_REVIEW) {
    updatePayload[PUBLICATION_COLS.PUBLISHED_AT] = null;
  }
  let { error } = await supabase
    .from(DB_TABLES.PUBLICATIONS)
    .update(updatePayload)
    .eq(PUBLICATION_COLS.ID, id);

  if (isMissingColumnError(error, PUBLICATION_COLS.PUBLISHED_AT)) {
    ({ error } = await supabase
      .from(DB_TABLES.PUBLICATIONS)
      .update({ [PUBLICATION_COLS.STATUS]: status })
      .eq(PUBLICATION_COLS.ID, id));
  }

  return { success: !error, error };
}

/**
 * Fetch minimal asset metadata needed for cleaning up storage files before publication deletion.
 */
export async function getPublicationAssetsForCleanup(
  id: string,
  client?: SupabaseClient
): Promise<{ cover_image_url: string | null; content: LocalizedString | null } | null> {
  try {
    const supabase = await resolveClient(client);
    const { data, error } = await supabase
      .from(DB_TABLES.PUBLICATIONS)
      .select(`${PUBLICATION_COLS.COVER_IMAGE_URL}, ${PUBLICATION_COLS.CONTENT}`)
      .eq(PUBLICATION_COLS.ID, id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      cover_image_url: (data.cover_image_url as string | null) ?? null,
      content: (data.content as LocalizedString | null) ?? null,
    };
  } catch (err) {
    console.warn('[DAL:publications] Failed to fetch publication assets for cleanup:', formatDbError(err));
    return null;
  }
}

/**
 * Count the number of currently pinned publications.
 */
export async function countPinnedPublications(
  client?: SupabaseClient
): Promise<{ count: number; error: unknown | null }> {
  try {
    const supabase = await resolveClient(client);
    const { count, error } = await supabase
      .from(DB_TABLES.PUBLICATIONS)
      .select('*', { count: 'exact', head: true })
      .eq(PUBLICATION_COLS.IS_PINNED, true);

    return { count: count ?? 0, error };
  } catch (err) {
    return { count: 0, error: err };
  }
}

/**
 * Update the pinned state of a publication.
 */
export async function setPublicationPinned(
  id: string,
  isPinned: boolean,
  client?: SupabaseClient
): Promise<{ success: boolean; error: unknown | null }> {
  try {
    const supabase = await resolveClient(client);
    const { error } = await supabase
      .from(DB_TABLES.PUBLICATIONS)
      .update({ [PUBLICATION_COLS.IS_PINNED]: isPinned })
      .eq(PUBLICATION_COLS.ID, id);

    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Delete a publication and verify at least one row was deleted (detecting silent RLS rejections).
 */
export async function deletePublication(
  id: string,
  client?: SupabaseClient
): Promise<{ success: boolean; error: unknown | null }> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from(DB_TABLES.PUBLICATIONS)
    .delete()
    .eq(PUBLICATION_COLS.ID, id)
    .select(PUBLICATION_COLS.ID);

  if (error) {
    return { success: false, error };
  }

  if (Array.isArray(data) && data.length === 0) {
    return { success: false, error: new Error('RLS blocked deletion or row not found') };
  }

  return { success: true, error: null };
}

export interface GetDashboardPublicationsOptions {
  authorId: string;
  forApproval?: boolean;
  client?: SupabaseClient;
}

async function runDashboardPublicationsQuery(
  supabase: SupabaseClient,
  options: GetDashboardPublicationsOptions,
  includePublishedAt: boolean
) {
  const selectCols = [
    PUBLICATION_COLS.ID,
    PUBLICATION_COLS.SLUG,
    PUBLICATION_COLS.TITLE,
    PUBLICATION_COLS.SUBTITLE,
    PUBLICATION_COLS.COVER_IMAGE_URL,
    PUBLICATION_COLS.TYPE,
    PUBLICATION_COLS.STATUS,
    PUBLICATION_COLS.ORIGINAL_LANGUAGE,
    PUBLICATION_COLS.IS_PINNED,
    PUBLICATION_COLS.CREATED_AT,
    PUBLICATION_COLS.UPDATED_AT,
    ...(includePublishedAt ? [PUBLICATION_COLS.PUBLISHED_AT] : []),
    PUBLICATION_COLS.AUTHOR_ID,
    `author:${DB_TABLES.USERS} (
      ${USER_COLS.ID},
      ${USER_COLS.FULL_NAME}
    )`,
  ].join(', ');

  let query = supabase
    .from(DB_TABLES.PUBLICATIONS)
    .select(selectCols)
    .order(PUBLICATION_COLS.CREATED_AT, { ascending: false });

  if (options.forApproval) {
    query = query.eq(PUBLICATION_COLS.STATUS, PUBLICATION_STATUSES.IN_REVIEW);
  } else {
    query = query.eq(PUBLICATION_COLS.AUTHOR_ID, options.authorId);
  }

  return await query;
}

/**
 * Fetch lightweight publication records for the writer desk dashboard.
 * Returns either publications awaiting approval (when `forApproval` is true)
 * or the author's own publications, ordered newest creation time first.
 * Never selects heavy content fields.
 */
export async function getDashboardPublications(
  options: GetDashboardPublicationsOptions
): Promise<PublicationDashboardItem[]> {
  try {
    const supabase = await resolveClient(options.client);

    let { data, error } = await runDashboardPublicationsQuery(supabase, options, true);
    if (isMissingColumnError(error, PUBLICATION_COLS.PUBLISHED_AT)) {
      ({ data, error } = await runDashboardPublicationsQuery(supabase, options, false));
    }

    if (error || !data) {
      console.warn('[DAL:publications] Failed to fetch dashboard publications:', formatDbError(error));
      return [];
    }

    const rows = data as unknown as PublicationDashboardItem[];
    return rows.map((row) => ({
      ...row,
      cover_image_url: cleanImageUrl(row.cover_image_url),
    }));
  } catch (err) {
    console.warn('[DAL:publications] Unexpected error fetching dashboard publications:', formatDbError(err));
    return [];
  }
}

/**
 * Computes guest author publication quota from an existing list of publications.
 */
export function computeGuestPublicationQuota(
  publications: Array<{ created_at: string }>
): GuestPublicationQuota {
  const currentYear = new Date().getFullYear();
  const totalCount = publications.length;
  const yearlyCount = publications.filter(
    (p) => new Date(p.created_at).getFullYear() === currentYear
  ).length;
  const totalLimit = GUEST_PUBLICATION_LIMITS.TOTAL;
  const yearlyLimit = GUEST_PUBLICATION_LIMITS.YEARLY;

  return {
    totalCount,
    yearlyCount,
    totalLimit,
    yearlyLimit,
    canCreate: totalCount < totalLimit && yearlyCount < yearlyLimit,
  };
}

/**
 * Queries an author's publication timestamps and returns guest quota status.
 */
export async function getGuestPublicationQuota(
  authorId: string,
  client?: SupabaseClient
): Promise<GuestPublicationQuota> {
  try {
    const supabase = await resolveClient(client);
    const { data, error } = await supabase
      .from(DB_TABLES.PUBLICATIONS)
      .select(PUBLICATION_COLS.CREATED_AT)
      .eq(PUBLICATION_COLS.AUTHOR_ID, authorId);

    if (error || !data) {
      console.warn('[DAL:publications] Failed to fetch guest quota:', formatDbError(error));
      return computeGuestPublicationQuota([]);
    }

    return computeGuestPublicationQuota(data as Array<{ created_at: string }>);
  } catch (err) {
    console.warn('[DAL:publications] Unexpected error fetching guest quota:', formatDbError(err));
    return computeGuestPublicationQuota([]);
  }
}
