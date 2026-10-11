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
} from '../types';
import { getPublicationCards } from './publications';

async function resolveClient(provided?: SupabaseClient): Promise<SupabaseClient> {
  if (provided) return provided;
  return await createServerClient();
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
