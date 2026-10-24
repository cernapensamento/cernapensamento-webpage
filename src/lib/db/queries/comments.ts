/**
 * Comments Data Access Queries
 * Typed queries for user discussions and feedback on publications.
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { DB_TABLES, COMMENT_COLS, USER_COLS } from '../schema';
import type { CommentItem, CommentRow } from '../types';

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

async function resolveClient(provided?: SupabaseClient): Promise<SupabaseClient> {
  if (provided) return provided;
  return await createServerClient();
}

/**
 * Fetch all comments for a publication, ordered from earliest to latest.
 */
export async function getCommentsForPublication(
  publicationId: string,
  client?: SupabaseClient
): Promise<CommentItem[]> {
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
    console.error('Error fetching comments:', error);
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
 * Delete a comment.
 */
export async function deleteComment(
  id: string,
  client?: SupabaseClient
): Promise<{ success: boolean; error: PostgrestError | null }> {
  const supabase = await resolveClient(client);

  const { error } = await supabase
    .from(DB_TABLES.COMMENTS)
    .delete()
    .eq(COMMENT_COLS.ID, id);

  return { success: !error, error };
}
