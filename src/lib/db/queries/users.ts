/**
 * Users Data Access Queries
 * Strongly-typed DAL queries for user profiles, columnists, and author pages.
 */

import { resolveClient } from '../resolveClient';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { i18n } from '@/i18n-config';
import {
  DB_TABLES,
  USER_COLS,
  USER_ROLES,
  PUBLICATION_COLS,
  PUBLICATION_STATUSES,
} from '../schema';
import type {
  UserRow,
  PublicUserRow,
  ColumnistItem,
  AuthorProfileDetail,
  PublishedAuthorItem,
  LocalizedString,
  PublicationType,
  UserRole,
} from '../types';
import { getPublicationCards } from './publications';
import { formatDbError, isMissingColumnError } from '../formatDbError';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PUBLIC_USER_SELECT = [
  USER_COLS.ID,
  USER_COLS.FULL_NAME,
  USER_COLS.SLUG,
  USER_COLS.BIO,
  USER_COLS.AVATAR_URL,
  USER_COLS.ROLE,
].join(', ');

const PRIVATE_USER_SELECT = `${PUBLIC_USER_SELECT}, ${USER_COLS.NEWSLETTER_SUBSCRIBED}`;

/**
 * Normalizes a biography into a LocalizedString map across all configured locales.
 */
function parseBio(rawBio: unknown): LocalizedString | null {
  if (!rawBio) return null;
  if (typeof rawBio === 'string') {
    const text = rawBio.trim();
    if (!text) return null;
    const res: Record<string, string> = {};
    for (const loc of i18n.locales) res[loc] = text;
    return res;
  }
  if (typeof rawBio === 'object') {
    const record = rawBio as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(record)) {
      if (typeof val === 'string' && val.trim().length > 0) {
        result[key] = val;
      }
    }
    if (Object.keys(result).length === 0) return null;
    const fallback = result[i18n.defaultLocale] || Object.values(result)[0] || '';
    for (const loc of i18n.locales) {
      result[loc] = result[loc] || fallback;
    }
    return result;
  }
  return null;
}

/**
 * Shared lookup helper to fetch a user by any column with explicit column projection.
 */
async function getUserBy<T>(
  column: string,
  value: string,
  selectColumns: string,
  client?: SupabaseClient
): Promise<T | null> {
  try {
    const supabase = await resolveClient(client);

    const { data, error } = await supabase
      .from(DB_TABLES.USERS)
      .select(selectColumns)
      .eq(column, value)
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        console.warn(`[DAL:users] Failed to fetch user by ${column} "${value}":`, formatDbError(error));
      }
      return null;
    }

    return data as T;
  } catch (err) {
    console.warn(`[DAL:users] Unexpected error fetching user by ${column} "${value}":`, formatDbError(err));
    return null;
  }
}

/**
 * Fetch an authenticated user profile by internal UUID (includes private preferences).
 */
export async function getUserById(
  id: string,
  client?: SupabaseClient
): Promise<UserRow | null> {
  return getUserBy<UserRow>(USER_COLS.ID, id, PRIVATE_USER_SELECT, client);
}

/**
 * Fetch a public user profile by author slug (excludes private columns such as newsletter_subscribed).
 */
export async function getUserBySlug(
  slug: string,
  client?: SupabaseClient
): Promise<PublicUserRow | null> {
  return getUserBy<PublicUserRow>(USER_COLS.SLUG, slug, PUBLIC_USER_SELECT, client);
}

/**
 * Fetch a public user profile by slug or internal UUID (safe for anonymous requests).
 */
export async function getUserBySlugOrId(
  slugOrId: string,
  client?: SupabaseClient
): Promise<PublicUserRow | null> {
  const column = UUID_REGEX.test(slugOrId) ? USER_COLS.ID : USER_COLS.SLUG;
  return getUserBy<PublicUserRow>(column, slugOrId, PUBLIC_USER_SELECT, client);
}

/**
 * Fetch founders and admins with non-null slugs, ordered by full name.
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
  published_at?: string | null;
  slug: string | null;
  title: LocalizedString;
  original_language?: string | null;
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

async function fetchPublishedAuthorsPage(
  supabase: SupabaseClient,
  offset: number,
  pageSize: number,
  includePublishedAt: boolean
) {
  const selectCols = [
    PUBLICATION_COLS.ID,
    PUBLICATION_COLS.TYPE,
    PUBLICATION_COLS.CREATED_AT,
    ...(includePublishedAt ? [PUBLICATION_COLS.PUBLISHED_AT] : []),
    PUBLICATION_COLS.SLUG,
    PUBLICATION_COLS.TITLE,
    PUBLICATION_COLS.ORIGINAL_LANGUAGE,
    PUBLICATION_COLS.AUTHOR_ID,
    `author:${DB_TABLES.USERS} (
      ${USER_COLS.ID},
      ${USER_COLS.FULL_NAME},
      ${USER_COLS.SLUG},
      ${USER_COLS.BIO},
      ${USER_COLS.AVATAR_URL},
      ${USER_COLS.ROLE}
    )`,
  ].join(', ');

  let query = supabase
    .from(DB_TABLES.PUBLICATIONS)
    .select(selectCols)
    .eq(PUBLICATION_COLS.STATUS, PUBLICATION_STATUSES.PUBLISHED);

  if (includePublishedAt) {
    query = query.order(PUBLICATION_COLS.PUBLISHED_AT, { ascending: false, nullsFirst: false });
  }

  return await query
    .order(PUBLICATION_COLS.CREATED_AT, { ascending: false })
    .order(PUBLICATION_COLS.ID, { ascending: false })
    .range(offset, offset + pageSize - 1);
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
    const pageSize = 1000;
    const authorsById = new Map<string, PublishedAuthorItem>();
    let includePublishedAt = true;

    for (let offset = 0; ; offset += pageSize) {
      let { data, error } = await fetchPublishedAuthorsPage(
        supabase,
        offset,
        pageSize,
        includePublishedAt
      );

      if (includePublishedAt && isMissingColumnError(error, PUBLICATION_COLS.PUBLISHED_AT)) {
        includePublishedAt = false;
        ({ data, error } = await fetchPublishedAuthorsPage(
          supabase,
          offset,
          pageSize,
          false
        ));
      }

      if (error || !data) {
        console.warn('[DAL:users] Failed to fetch published authors:', formatDbError(error));
        return [];
      }

      for (const row of (data as unknown as RawAuthorPublicationRow[])) {
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
            latest_publication_at: row.published_at || row.created_at,
            latest_publication_title: row.title,
            latest_publication_slug: row.slug,
            latest_publication_original_language: row.original_language || i18n.defaultLocale,
            publication_types: [row.type],
          });
          continue;
        }

        existing.published_count += 1;
        if (!existing.publication_types.includes(row.type)) {
          existing.publication_types.push(row.type);
        }
      }

      if (data.length < pageSize) break;
    }

    return Array.from(authorsById.values()).sort((a, b) => {
      if (b.published_count !== a.published_count) {
        return b.published_count - a.published_count;
      }
      return a.full_name.localeCompare(b.full_name, 'gl');
    });
  } catch (err) {
    console.warn('[DAL:users] Unexpected error fetching published authors:', formatDbError(err));
    return [];
  }
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
