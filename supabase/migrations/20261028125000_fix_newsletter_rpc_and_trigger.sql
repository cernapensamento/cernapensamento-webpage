-- ==============================================================================
-- Migration: Fix Newsletter RPCs and Trigger Contract (CodeRabbit Feedback)
-- Restores auth.users join for email resolution, case-insensitive trimmed unsubscribe match,
-- and dispatches the newsletter webhook via pg_net with the expected payload.
-- ==============================================================================

BEGIN;

-- 1. get_subscribers_emails RPC: join auth.users to resolve user emails safely
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

REVOKE ALL ON FUNCTION "public"."get_subscribers_emails"("text") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_subscribers_emails"("text") TO "service_role";

-- 2. unsubscribe_newsletter_by_email RPC: match target_email via auth.users with case-insensitivity
CREATE OR REPLACE FUNCTION "public"."unsubscribe_newsletter_by_email"("target_email" "text") 
RETURNS boolean
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: service_role required';
  END IF;

  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(TRIM(target_email)) 
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.users
  SET newsletter_subscribed = FALSE
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION "public"."unsubscribe_newsletter_by_email"("text") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."unsubscribe_newsletter_by_email"("text") TO "service_role";

-- 3. Dispatch the newsletter webhook via pg_net with { record: row_to_json(NEW) }
CREATE OR REPLACE FUNCTION "public"."trigger_publication_published_newsletter"()
RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret text;
  v_headers jsonb;
  v_url text;
BEGIN
  v_secret := current_setting('app.settings.webhook_secret', true);
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING 'app.settings.webhook_secret is not set. Webhook skipped.';
    RETURN NEW;
  END IF;

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_secret
  );

  v_url := COALESCE(current_setting('app.settings.site_url', true), 'https://cernapensamento.org') || '/api/webhooks/newsletter';

  PERFORM net.http_post(
    url := v_url,
    body := jsonb_build_object('record', row_to_json(NEW)),
    headers := v_headers,
    timeout_milliseconds := 5000
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
