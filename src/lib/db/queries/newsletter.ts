/**
 * Newsletter Data Access Queries
 * Typed DAL functions for newsletter subscriber dispatch and unsubscribe flows.
 */

import { createClient, type SupabaseClient, type PostgrestError } from '@supabase/supabase-js';
import {
  DB_TABLES,
  PUBLICATION_COLS,
  PUBLICATION_STATUSES,
  USER_COLS,
} from '../schema';
import type { PublicationRow } from '../types';

export interface SubscriberRecord {
  email: string;
  full_name?: string | null;
}

/**
 * Creates a standalone Supabase client for newsletter webhook and unsubscribe endpoints.
 * Uses the service role key when required or available, otherwise the public anon key.
 */
export function createNewsletterSupabaseClient(
  requireServiceRole: boolean = false
): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseKey = requireServiceRole
    ? serviceKey!
    : serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Unsubscribes an email address from editorial newsletter dispatches via RPC.
 */
export async function unsubscribeNewsletterByEmail(
  email: string,
  client?: SupabaseClient
): Promise<{ error: PostgrestError | null }> {
  const supabase = client ?? createNewsletterSupabaseClient(false);
  const { error } = await supabase.rpc('unsubscribe_newsletter_by_email', {
    target_email: email.trim().toLowerCase(),
  });
  return { error };
}

/**
 * Atomically claims a published publication for newsletter dispatch by setting newsletter_sent_at.
 * Returns null data if another worker already claimed it or it is no longer eligible.
 */
export async function claimPublicationForNewsletter(
  publicationId: string,
  client: SupabaseClient
): Promise<{ data: PublicationRow | null; error: PostgrestError | null }> {
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from(DB_TABLES.PUBLICATIONS)
    .update({ [PUBLICATION_COLS.NEWSLETTER_SENT_AT]: nowIso })
    .eq(PUBLICATION_COLS.ID, publicationId)
    .eq(PUBLICATION_COLS.STATUS, PUBLICATION_STATUSES.PUBLISHED)
    .is(PUBLICATION_COLS.NEWSLETTER_SENT_AT, null)
    .select('*')
    .maybeSingle();

  return { data: (data as PublicationRow | null) || null, error };
}

/**
 * Releases the newsletter dispatch claim on a publication after a failed batch.
 */
export async function releasePublicationNewsletterClaim(
  publicationId: string,
  client: SupabaseClient
): Promise<void> {
  await client
    .from(DB_TABLES.PUBLICATIONS)
    .update({ [PUBLICATION_COLS.NEWSLETTER_SENT_AT]: null })
    .eq(PUBLICATION_COLS.ID, publicationId);
}

/**
 * Fetches the author's full name for a newsletter email header.
 */
export async function getNewsletterAuthorName(
  authorId: string,
  client: SupabaseClient
): Promise<string | null> {
  const { data } = await client
    .from(DB_TABLES.USERS)
    .select(USER_COLS.FULL_NAME)
    .eq(USER_COLS.ID, authorId)
    .maybeSingle();

  return data?.full_name || null;
}

/**
 * Fetches active newsletter subscribers via the protected RPC.
 */
export async function getNewsletterSubscribers(
  webhookSecret: string,
  client: SupabaseClient
): Promise<{ data: SubscriberRecord[]; error: PostgrestError | null }> {
  const { data, error } = await client.rpc('get_subscribers_emails', {
    webhook_secret: webhookSecret,
  });

  return {
    data: (data as SubscriberRecord[] | null) || [],
    error,
  };
}
