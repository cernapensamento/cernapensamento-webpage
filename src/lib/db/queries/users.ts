/**
 * Users Data Access Queries
 * Typed queries for user profiles, columnists, and author pages.
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import {
  DB_TABLES,
  USER_COLS,
  USER_ROLES,
  PUBLICATION_COLS,
  PUBLICATION_STATUSES,
} from '../schema';
import type {
  UserRow,
  ColumnistItem,
  AuthorProfileDetail,
  PublishedAuthorItem,
  LocalizedString,
  PublicationType,
  UserRole,
} from '../types';
import { getPublicationCards } from './publications';
import { formatDbError } from '../formatDbError';

async function resolveClient(provided?: SupabaseClient): Promise<SupabaseClient> {
  if (provided) return provided;
  return await createServerClient();
}

function parseBio(rawBio: unknown): LocalizedString | null {
  if (!rawBio) return null;
  if (typeof rawBio === 'object' && rawBio !== null) {
    const b = rawBio as Record<string, unknown>;
    const glStr = typeof b.gl === 'string' ? b.gl : (typeof b.es === 'string' ? b.es : '');
    const esStr = typeof b.es === 'string' ? b.es : (typeof b.gl === 'string' ? b.gl : '');
    return { gl: glStr, es: esStr };
  }
  if (typeof rawBio === 'string') {
    return { gl: rawBio, es: rawBio };
  }
  return null;
}

function mapLegacyProfile(row: Record<string, unknown>): UserRow {
  return {
    id: (row.id as string) || '',
    full_name: (row.nombre as string) || 'Anónimo',
    slug: (row.slug as string) || null,
    bio: parseBio(row.bio),
    avatar_url: (row.avatar_url as string) || null,
    role: (row.rol === 'escritor' ? USER_ROLES.FOUNDER : row.rol === 'admin' ? USER_ROLES.ADMIN : USER_ROLES.MEMBER),
    newsletter_subscribed: Boolean(row.recibir_newsletter),
  };
}

/**
 * Fetch a user profile by internal UUID.
 */
export async function getUserById(
  id: string,
  client?: SupabaseClient
): Promise<UserRow | null> {
  try {
    const supabase = await resolveClient(client);

    const { data, error } = await supabase
      .from(DB_TABLES.USERS)
      .select('*')
      .eq(USER_COLS.ID, id)
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST205') {
        const { data: legData, error: legErr } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', id)
          .single();
        if (!legErr && legData) {
          return mapLegacyProfile(legData as Record<string, unknown>);
        }
      }
      if (error && error.code !== 'PGRST116') {
        console.warn(`[DAL:users] Failed to fetch user by id "${id}":`, formatDbError(error));
      }
      return null;
    }

    return data as UserRow;
  } catch (err) {
    console.warn(`[DAL:users] Unexpected error fetching user by id "${id}":`, formatDbError(err));
    return null;
  }
}

/**
 * Fetch a user profile by public author slug.
 */
export async function getUserBySlug(
  slug: string,
  client?: SupabaseClient
): Promise<UserRow | null> {
  try {
    const supabase = await resolveClient(client);

    const { data, error } = await supabase
      .from(DB_TABLES.USERS)
      .select('*')
      .eq(USER_COLS.SLUG, slug)
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST205') {
        const { data: legData, error: legErr } = await supabase
          .from('perfiles')
          .select('*')
          .eq('slug', slug)
          .single();
        if (!legErr && legData) {
          return mapLegacyProfile(legData as Record<string, unknown>);
        }
      }
      if (error && error.code !== 'PGRST116') {
        console.warn(`[DAL:users] Failed to fetch user by slug "${slug}":`, formatDbError(error));
      }
      return null;
    }

    return data as UserRow;
  } catch (err) {
    console.warn(`[DAL:users] Unexpected error fetching user by slug "${slug}":`, formatDbError(err));
    return null;
  }
}

/**
 * Fetch editorial columnists (Founders) for the homepage section.
 */
export async function getColumnists(
  client?: SupabaseClient
): Promise<ColumnistItem[]> {
  try {
    const supabase = await resolveClient(client);

    const { data, error } = await supabase
      .from(DB_TABLES.USERS)
      .select(`
        ${USER_COLS.ID},
        ${USER_COLS.FULL_NAME},
        ${USER_COLS.SLUG},
        ${USER_COLS.BIO},
        ${USER_COLS.AVATAR_URL},
        ${USER_COLS.ROLE}
      `)
      .in(USER_COLS.ROLE, [USER_ROLES.FOUNDER, USER_ROLES.ADMIN])
      .not(USER_COLS.SLUG, 'is', null)
      .order(USER_COLS.FULL_NAME, { ascending: true });

    if (error || !data) {
      if (error?.code === 'PGRST205') {
        const { data: legData, error: legErr } = await supabase
          .from('perfiles')
          .select('id, nombre, slug, bio, avatar_url, rol')
          .in('rol', ['escritor', 'admin', 'fundador'])
          .not('slug', 'is', null)
          .order('nombre', { ascending: true });

        if (!legErr && legData) {
          return legData.map((row) => ({
            id: row.id,
            full_name: row.nombre || 'Anónimo',
            slug: row.slug || null,
            bio: parseBio(row.bio),
            avatar_url: row.avatar_url || null,
            role: row.rol === 'admin' ? USER_ROLES.ADMIN : USER_ROLES.FOUNDER,
          })) as ColumnistItem[];
        }
      }
      console.warn('[DAL:users] Failed to fetch columnists:', formatDbError(error));
      return [];
    }

    return data as ColumnistItem[];
  } catch (err) {
    console.warn('[DAL:users] Unexpected error fetching columnists:', formatDbError(err));
    return [];
  }
}

interface RawAuthorPublicationRow {
  id: string;
  type: PublicationType;
  created_at: string;
  slug: string | null;
  title: LocalizedString;
  author_id: string;
  author: {
    id: string;
    full_name: string;
    slug: string | null;
    bio: unknown;
    avatar_url: string | null;
    role: UserRole;
  } | null;
}

interface LegacyAuthorPublicationRow {
  id: string;
  slug: string | null;
  tipo: string | null;
  creado_en: string;
  titulo_gl: string | null;
  titulo_es: string | null;
  autor_id: string;
  perfiles: {
    id?: string;
    nombre?: string;
    slug?: string | null;
    avatar_url?: string | null;
    biografia?: string | null;
  } | null;
}

function sortPublishedAuthors(authors: PublishedAuthorItem[]): PublishedAuthorItem[] {
  return authors.sort((a, b) => {
    if (b.published_count !== a.published_count) {
      return b.published_count - a.published_count;
    }
    return a.full_name.localeCompare(b.full_name, 'gl');
  });
}

async function getLegacyPublishedAuthors(
  supabase: SupabaseClient
): Promise<PublishedAuthorItem[]> {
  try {
    const { data, error } = await supabase
      .from('articulos')
      .select(`
        id, slug, tipo, creado_en, titulo_gl, titulo_es, autor_id,
        perfiles:autor_id (id, nombre, slug, avatar_url, biografia)
      `)
      .eq('estado', 'publicado')
      .order('creado_en', { ascending: false });

    if (error || !data) {
      console.warn('[DAL:users] Legacy published authors error:', formatDbError(error));
      return [];
    }

    const authorsById = new Map<string, PublishedAuthorItem>();

    for (const row of data as unknown as LegacyAuthorPublicationRow[]) {
      const author = row.perfiles;
      const authorId = author?.id || row.autor_id;
      if (!authorId) continue;

      const publicationType = (
        row.tipo === 'ensaio' ? 'essay' : row.tipo === 'noticia' ? 'news' : 'article'
      ) as PublicationType;
      const title = { gl: row.titulo_gl || '', es: row.titulo_es || '' };

      const existing = authorsById.get(authorId);
      if (!existing) {
        authorsById.set(authorId, {
          id: authorId,
          full_name: author?.nombre || 'Anónimo',
          slug: author?.slug || null,
          bio: author?.biografia
            ? { gl: author.biografia, es: author.biografia }
            : null,
          avatar_url: author?.avatar_url || null,
          role: USER_ROLES.MEMBER,
          published_count: 1,
          latest_publication_at: row.creado_en,
          latest_publication_title: title,
          latest_publication_slug: row.slug,
          publication_types: [publicationType],
        });
        continue;
      }

      existing.published_count += 1;
      if (!existing.publication_types.includes(publicationType)) {
        existing.publication_types.push(publicationType);
      }
    }

    return sortPublishedAuthors(Array.from(authorsById.values()));
  } catch (err) {
    console.warn('[DAL:users] Unexpected error fetching legacy published authors:', formatDbError(err));
    return [];
  }
}

/**
 * Fetch every author with at least one published publication, aggregating
 * lightweight publication metadata for the public author directory.
 * Heavy content fields are never selected.
 */
export async function getPublishedAuthors(
  client?: SupabaseClient
): Promise<PublishedAuthorItem[]> {
  try {
    const supabase = await resolveClient(client);

    const { data, error } = await supabase
      .from(DB_TABLES.PUBLICATIONS)
      .select(`
        ${PUBLICATION_COLS.ID},
        ${PUBLICATION_COLS.TYPE},
        ${PUBLICATION_COLS.CREATED_AT},
        ${PUBLICATION_COLS.SLUG},
        ${PUBLICATION_COLS.TITLE},
        ${PUBLICATION_COLS.AUTHOR_ID},
        author:${DB_TABLES.USERS} (
          ${USER_COLS.ID},
          ${USER_COLS.FULL_NAME},
          ${USER_COLS.SLUG},
          ${USER_COLS.BIO},
          ${USER_COLS.AVATAR_URL},
          ${USER_COLS.ROLE}
        )
      `)
      .eq(PUBLICATION_COLS.STATUS, PUBLICATION_STATUSES.PUBLISHED)
      .order(PUBLICATION_COLS.CREATED_AT, { ascending: false });

    if (error || !data) {
      if (error?.code === 'PGRST205') {
        return getLegacyPublishedAuthors(supabase);
      }
      console.warn('[DAL:users] Failed to fetch published authors:', formatDbError(error));
      return [];
    }

    const authorsById = new Map<string, PublishedAuthorItem>();

    for (const row of data as unknown as RawAuthorPublicationRow[]) {
      const author = row.author;
      if (!author) continue;

      const existing = authorsById.get(author.id);
      if (!existing) {
        authorsById.set(author.id, {
          id: author.id,
          full_name: author.full_name,
          slug: author.slug,
          bio: parseBio(author.bio),
          avatar_url: author.avatar_url,
          role: author.role,
          published_count: 1,
          latest_publication_at: row.created_at,
          latest_publication_title: row.title,
          latest_publication_slug: row.slug,
          publication_types: [row.type],
        });
        continue;
      }

      existing.published_count += 1;
      if (!existing.publication_types.includes(row.type)) {
        existing.publication_types.push(row.type);
      }
    }

    return sortPublishedAuthors(Array.from(authorsById.values()));
  } catch (err) {
    console.warn('[DAL:users] Unexpected error fetching published authors:', formatDbError(err));
    return [];
  }
}

/**
 * Fetch a user profile by slug or internal UUID.
 */
export async function getUserBySlugOrId(
  slugOrId: string,
  client?: SupabaseClient
): Promise<UserRow | null> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
  if (isUUID) {
    return await getUserById(slugOrId, client);
  }
  return await getUserBySlug(slugOrId, client);
}

/**
 * Fetch author profile with all their published publications for /autor/[slug].
 * Supports both author slug and UUID.
 */
export async function getAuthorProfileBySlug(
  slugOrId: string,
  client?: SupabaseClient,
  lang?: string
): Promise<AuthorProfileDetail | null> {
  const user = await getUserBySlugOrId(slugOrId, client);
  if (!user) return null;

  const publications = await getPublicationCards({
    authorId: user.id,
    limit: 100,
    client,
    lang,
  });

  return {
    id: user.id,
    full_name: user.full_name,
    slug: user.slug,
    bio: user.bio,
    avatar_url: user.avatar_url,
    role: user.role,
    publications,
  };
}

export const getAuthorProfileBySlugOrId = getAuthorProfileBySlug;

/**
 * Update a user profile row.
 */
export async function updateUserProfile(
  id: string,
  payload: Partial<UserRow>,
  client?: SupabaseClient
): Promise<{ data: UserRow | null; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);

  const { data, error } = await supabase
    .from(DB_TABLES.USERS)
    .update(payload)
    .eq(USER_COLS.ID, id)
    .select()
    .single();

  return { data: (data as UserRow) || null, error };
}
