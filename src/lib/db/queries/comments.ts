/**
 * Comments Data Access Queries
 * Typed queries for user discussions and feedback on publications.
 */

import { resolveClient } from '../resolveClient';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { DB_TABLES, COMMENT_COLS, USER_COLS } from '../schema';
import type { CommentItem, CommentRow } from '../types';
import { formatDbError } from '../formatDbError';

interface RawCommentRow {
  id: string;
  publication_id: string;
  author_id: string;
  content: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    slug: string | null;
  } | null;
}

/**
 * Fetch all comments for a publication, ordered by update time from earliest to latest.
 * Missing authors receive a placeholder profile. Query errors and caught exceptions
 * return an empty array. Uses the supplied client or a request-bound server client.
 */
export async function getCommentsForPublication(
  publicationId: string,
  client?: SupabaseClient
): Promise<CommentItem[]> {
  try {
    const supabase = await resolveClient(client);

    const { data, error } = await supabase
      .from(DB_TABLES.COMMENTS)
      .select(`
        ${COMMENT_COLS.ID},
        ${COMMENT_COLS.PUBLICATION_ID},
        ${COMMENT_COLS.AUTHOR_ID},
        ${COMMENT_COLS.CONTENT},
        ${COMMENT_COLS.UPDATED_AT},
        author:${DB_TABLES.USERS} (
          ${USER_COLS.ID},
          ${USER_COLS.FULL_NAME},
          ${USER_COLS.AVATAR_URL},
          ${USER_COLS.SLUG}
        )
      `)
      .eq(COMMENT_COLS.PUBLICATION_ID, publicationId)
      .order(COMMENT_COLS.UPDATED_AT, { ascending: true });

    if (error || !data) {
      console.warn('[DAL:comments] Failed to fetch comments:', formatDbError(error));
      return [];
    }

    const rawRows = data as unknown as RawCommentRow[];

    return rawRows.map((row) => ({
      id: row.id,
      publication_id: row.publication_id,
      author_id: row.author_id,
      content: row.content,
      updated_at: row.updated_at,
      author: row.author || {
        id: row.author_id,
        full_name: 'Usuario',
        avatar_url: null,
        slug: null,
      },
    }));
  } catch (err) {
    console.warn('[DAL:comments] Unexpected error fetching comments:', formatDbError(err));
    return [];
  }
}

/**
 * Insert a new user comment (enforces unique constraints instead of upserting).
 */
export async function createComment(
  publicationId: string,
  authorId: string,
  content: string,
  client?: SupabaseClient
): Promise<{ data: CommentRow | null; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);

  const { data, error } = await supabase
    .from(DB_TABLES.COMMENTS)
    .insert({
      [COMMENT_COLS.PUBLICATION_ID]: publicationId,
      [COMMENT_COLS.AUTHOR_ID]: authorId,
      [COMMENT_COLS.CONTENT]: content,
    })
    .select()
    .single();

  return { data: (data as CommentRow) || null, error };
}

/**
 * Add or upsert a user comment.
 */
export async function addComment(
  publicationId: string,
  authorId: string,
  content: string,
  client?: SupabaseClient
): Promise<{ data: CommentRow | null; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);

  const { data, error } = await supabase
    .from(DB_TABLES.COMMENTS)
    .upsert({
      [COMMENT_COLS.PUBLICATION_ID]: publicationId,
      [COMMENT_COLS.AUTHOR_ID]: authorId,
      [COMMENT_COLS.CONTENT]: content,
    })
    .select()
    .single();

  return { data: (data as CommentRow) || null, error };
}

/**
 * Update an existing comment.
 */
export async function updateComment(
  id: string,
  content: string,
  client?: SupabaseClient
): Promise<{ data: CommentRow | null; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);

  const { data, error } = await supabase
    .from(DB_TABLES.COMMENTS)
    .update({ [COMMENT_COLS.CONTENT]: content })
    .eq(COMMENT_COLS.ID, id)
    .select()
    .single();

  return { data: (data as CommentRow) || null, error };
}

/**
 * Delete a comment and verify a row was deleted (detecting silent RLS rejections).
 */
export async function deleteComment(
  id: string,
  client?: SupabaseClient
): Promise<{ success: boolean; error: unknown | null }> {
  const supabase = await resolveClient(client);

  const { data, error } = await supabase
    .from(DB_TABLES.COMMENTS)
    .delete()
    .eq(COMMENT_COLS.ID, id)
    .select(COMMENT_COLS.ID);

  if (error) {
    return { success: false, error };
  }

  if (Array.isArray(data) && data.length === 0) {
    return { success: false, error: new Error('RLS blocked deletion or comment not found') };
  }

  return { success: true, error: null };
}
