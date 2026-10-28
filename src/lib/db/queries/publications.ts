/**
 * Publications Data Access Queries
 * Strongly typed queries for articles, essays, and stories.
 * Enforces bandwidth egress guardrails (never selects full content on listing queries).
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { sanitizeStorageUrl } from '@/lib/storage';
import {
  DB_TABLES,
  PUBLICATION_COLS,
  USER_COLS,
  PUBLICATION_STATUSES,
} from '../schema';
import { getPublicationIdsByTagSlugs } from './tags';
import { formatDbError } from '../formatDbError';
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
 * Fetch a publication by slug or UUID with full content, author details, and tags.
 * An unmatched slug ending in six alphanumeric characters after a hyphen can
 * resolve to the first slug sharing that suffix; the result keeps its current slug.
 * Falls back to legacy articles when the canonical table is missing (without tags).
 * Returns null for no match, query failure, or caught exception. Visibility depends
 * on the supplied client or request-bound server client; no status filter is added.
 * `lang` selects tag names, defaulting to `gl`, then the first translation or slug.
 */
export async function getPublicationBySlug(
  slugOrId: string,
  options?: { client?: SupabaseClient; lang?: string }
): Promise<PublicationDetail | null> {
  try {
    const supabase = await resolveClient(options?.client);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
    const columnKey = isUUID ? PUBLICATION_COLS.ID : PUBLICATION_COLS.SLUG;
    const suffixMatch = !isUUID ? slugOrId.match(/-([a-z0-9]{6})$/i) : null;
    const suffix = suffixMatch ? suffixMatch[1] : null;

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

    let activeData = data;
    if (!activeData && suffix && error?.code !== 'PGRST205') {
      const { data: suffixData } = await supabase
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
        .ilike(PUBLICATION_COLS.SLUG, `%-${suffix}`)
        .limit(1)
        .maybeSingle();

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
          .single();

        let activeLegacyData = legacyData;
        if (!activeLegacyData && suffix) {
          const { data: suffixLegacyData } = await supabase
            .from('articulos')
            .select(`
              id, slug, titulo_gl, titulo_es, subtitulo_gl, subtitulo_es, contenido_gl, contenido_es,
              imagen_url, tipo, estado, fijado, idioma_original, creado_en, actualizado_en, autor_id,
              perfiles:autor_id (id, nombre, slug, avatar_url, biografia)
            `)
            .ilike('slug', `%-${suffix}`)
            .limit(1)
            .maybeSingle();

          if (suffixLegacyData) {
            activeLegacyData = suffixLegacyData;
          }
        }

        if (!activeLegacyData) {
          if (legacyError && legacyError.code !== 'PGRST116') {
            console.warn('[DAL:publications] Legacy query error:', formatDbError(legacyError));
          }
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
          created_at: activeLegacyData.creado_en,
          updated_at: activeLegacyData.actualizado_en,
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
      if (error && error.code !== 'PGRST116') {
        console.warn(`[DAL:publications] Failed to fetch publication by ${columnKey} "${slugOrId}":`, formatDbError(error));
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
      created_at: activeData.created_at,
      updated_at: activeData.updated_at,
      author: normalizedAuthor,
      tags: normalizeTags(activeData.publication_tags, options?.lang),
    };
  } catch (err) {
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

    if (allowedIds !== null) {
      query = query.in(PUBLICATION_COLS.ID, allowedIds);
    }
    if (options?.type) {
      query = query.eq(PUBLICATION_COLS.TYPE, options.type);
    }
    if (options?.authorId) {
      query = query.eq(PUBLICATION_COLS.AUTHOR_ID, options.authorId);
    }
    if (options?.isPinned !== undefined) {
      query = query.eq(PUBLICATION_COLS.IS_PINNED, options.isPinned);
    }
    if (options?.searchQuery) {
      const q = options.searchQuery.trim();
      if (q) {
        query = query.or(`title->>gl.ilike.%${q}%,title->>es.ilike.%${q}%,subtitle->>gl.ilike.%${q}%,subtitle->>es.ilike.%${q}%`);
      }
    }

    const { data, error } = await query;
    if (error || !data) {
      if (error?.code === 'PGRST205') {
        let legQuery = supabase
          .from('articulos')
          .select(`
            id, slug, titulo_gl, titulo_es, subtitulo_gl, subtitulo_es, imagen_url, tipo, estado, fijado, creado_en, actualizado_en, autor_id,
            perfiles:autor_id (id, nombre, slug, avatar_url)
          `)
          .order('creado_en', { ascending: false })
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
          const q = options.searchQuery.trim();
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
