/**
 * Users Data Access Queries
 * Typed queries for user profiles, columnists, and author pages.
 */

import { createClient as createServerClient } from '@/utils/supabase/server';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { DB_TABLES, USER_COLS, USER_ROLES } from '../schema';
import type {
  UserRow,
  ColumnistItem,
  AuthorProfileDetail,
  LocalizedString,
} from '../types';
import { getPublicationCards } from './publications';

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
    return null;
  }

  return data as UserRow;
}

/**
 * Fetch a user profile by public author slug.
 */
export async function getUserBySlug(
  slug: string,
  client?: SupabaseClient
): Promise<UserRow | null> {
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
    return null;
  }

  return data as UserRow;
}

/**
 * Fetch editorial columnists (Founders) for the homepage section.
 */
export async function getColumnists(
  client?: SupabaseClient
): Promise<ColumnistItem[]> {
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
    console.error('Error fetching columnists:', error);
    return [];
  }

  return data as ColumnistItem[];
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
