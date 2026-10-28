-- ==============================================================================
-- Migration: Newsletter Hardening & Idempotency
-- Adds newsletter_sent_at to publications, optimizes publication trigger with WHEN clause,
-- updates get_subscribers_emails RPC authorization, and adds unsubscribe helper RPC.
-- ==============================================================================

BEGIN;

-- 1. Add newsletter_sent_at column to publications
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS newsletter_sent_at timestamptz NULL;

-- 2. Backfill existing published publications so they are never re-notified
UPDATE public.publications
SET newsletter_sent_at = COALESCE(updated_at, created_at, now())
WHERE status = 'published' AND newsletter_sent_at IS NULL;

-- 3. Enhance get_subscribers_emails RPC to accept service_role only
CREATE OR REPLACE FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") 
RETURNS TABLE("email" "text", "full_name" "text")
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: service_role required';
  END IF;

  RETURN QUERY
  SELECT au.email::text, u.full_name::text
  FROM auth.users au
  JOIN public.users u ON au.id = u.id
  WHERE u.newsletter_subscribed = TRUE AND au.email IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION "public"."get_subscribers_emails"("text") FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION "public"."get_subscribers_emails"("text") TO service_role;

-- 4. Helper RPC for 1-click unsubscribe by email
CREATE OR REPLACE FUNCTION "public"."unsubscribe_newsletter_by_email"("target_email" "text")
RETURNS boolean
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email) LIMIT 1;
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.users
  SET newsletter_subscribed = FALSE
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION "public"."unsubscribe_newsletter_by_email"("text") FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION "public"."unsubscribe_newsletter_by_email"("text") TO service_role;

-- 5. Optimize trigger to fire strictly when status is 'published' and newsletter_sent_at is NULL
CREATE OR REPLACE FUNCTION "public"."trigger_publication_published_newsletter"()
RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret text;
  v_headers text;
  v_url text;
BEGIN
  v_secret := current_setting('app.settings.webhook_secret', true);
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING 'app.settings.webhook_secret is not set. Webhook skipped.';
    RETURN NEW;
  END IF;

  v_headers := json_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_secret
  )::text;

  v_url := COALESCE(current_setting('app.settings.site_url', true), 'https://cernapensamento.org') || '/api/webhooks/newsletter';

  PERFORM "supabase_functions"."http_request"(
    v_url,
    'POST',
    v_headers,
    json_build_object('record', row_to_json(NEW))::text,
    '5000'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "on_publication_published_newsletter" ON "public"."publications";

CREATE TRIGGER "on_publication_published_newsletter"
  AFTER INSERT OR UPDATE ON "public"."publications"
  FOR EACH ROW
  WHEN (NEW.status = 'published' AND NEW.newsletter_sent_at IS NULL)
  EXECUTE FUNCTION "public"."trigger_publication_published_newsletter"();

COMMIT;
