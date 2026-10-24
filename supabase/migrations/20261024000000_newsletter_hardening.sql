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

-- 3. Enhance get_subscribers_emails RPC to accept service_role, app setting or default secret
CREATE OR REPLACE FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") 
RETURNS TABLE("email" "text", "full_name" "text")
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  expected_secret text;
BEGIN
  expected_secret := COALESCE(current_setting('app.settings.webhook_secret', true), 'CERNA_WEBHOOK_SECRET_98765');

  IF auth.role() != 'service_role' AND webhook_secret != expected_secret AND webhook_secret != 'CERNA_WEBHOOK_SECRET_98765' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT au.email::text, u.full_name
  FROM auth.users au
  JOIN public.users u ON au.id = u.id
  WHERE u.newsletter_subscribed = TRUE;
END;
$$;

-- 4. Helper RPC for 1-click unsubscribe by email
CREATE OR REPLACE FUNCTION "public"."unsubscribe_newsletter_by_email"("target_email" "text")
RETURNS boolean
LANGUAGE "plpgsql" SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION "public"."unsubscribe_newsletter_by_email"("text") TO anon, authenticated, service_role;

-- 5. Optimize trigger to fire strictly when status is 'published' and newsletter_sent_at is NULL
DROP TRIGGER IF EXISTS "on_publication_published_newsletter" ON "public"."publications";

CREATE TRIGGER "on_publication_published_newsletter"
  AFTER INSERT OR UPDATE ON "public"."publications"
  FOR EACH ROW
  WHEN (NEW.status = 'published' AND NEW.newsletter_sent_at IS NULL)
  EXECUTE FUNCTION "supabase_functions"."http_request"(
    'https://cernapensamento.org/api/webhooks/newsletter',
    'POST',
    '{"Authorization":"Bearer CERNA_WEBHOOK_SECRET_98765"}',
    '{}',
    '5000'
  );

COMMIT;
