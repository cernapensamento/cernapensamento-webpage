-- ==============================================================================
-- Migration: Harden published_at transitions and newsletter Vault secret lookup
-- 1. set_publication_published_at():
--    Always stamp published_at = now() when transitioning into 'published' from
--    a non-published state (draft / in_review), even if the client supplied a
--    stale published_at value.
-- 2. dispatch_newsletter_webhook():
--    Make Vault secret lookup deterministic (prefer 'webhook_secret' over
--    'app.settings.webhook_secret', newest updated_at first) and btrim() the
--    secret to avoid silent whitespace mismatches.
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.set_publication_published_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'published'::public.publication_status THEN
    IF TG_OP = 'INSERT' AND NEW.published_at IS NULL THEN
      NEW.published_at := timezone('utc'::text, now());
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.status IS DISTINCT FROM 'published'::public.publication_status THEN
        -- Always stamp real publication time when transitioning from draft/in_review to published
        NEW.published_at := timezone('utc'::text, now());
      ELSIF OLD.status = 'published'::public.publication_status THEN
        -- Preserve original published_at when edited while already published
        NEW.published_at := COALESCE(OLD.published_at, NEW.published_at, timezone('utc'::text, now()));
      END IF;
    END IF;
  ELSIF NEW.status IN ('draft'::public.publication_status, 'in_review'::public.publication_status) THEN
    IF TG_OP = 'UPDATE' AND OLD.status = 'published'::public.publication_status THEN
      NEW.published_at := NULL;
    ELSIF TG_OP = 'INSERT' THEN
      NEW.published_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_newsletter_webhook(publication public.publications)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret text;
  v_site_url text;
  v_url text;
  v_headers jsonb;
  v_request_id bigint;
BEGIN
  -- Count even configuration/enqueue failures so every automatic path is bounded.
  UPDATE public.newsletter_dispatches
  SET attempts = attempts + 1,
      next_attempt_at = now() + interval '1 minute' * power(2, attempts)
  WHERE publication_id = publication.id AND attempts < 5;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  BEGIN
    v_secret := btrim(current_setting('app.settings.webhook_secret', true));
    IF v_secret IS NULL OR v_secret = '' THEN
      SELECT btrim(decrypted_secret) INTO v_secret
      FROM vault.decrypted_secrets
      WHERE name IN ('webhook_secret', 'app.settings.webhook_secret')
      ORDER BY CASE WHEN name = 'webhook_secret' THEN 0 ELSE 1 END, updated_at DESC
      LIMIT 1;
    END IF;

    IF v_secret IS NULL OR v_secret = '' THEN
      RAISE EXCEPTION 'app.settings.webhook_secret is not set. Webhook skipped.';
    END IF;

    v_site_url := COALESCE(current_setting('app.settings.site_url', true), 'https://cernapensamento.org');
    IF v_site_url !~* '^https://' THEN
      RAISE EXCEPTION 'Newsletter webhook requires HTTPS';
    END IF;

    v_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    );
    v_url := v_site_url || '/api/webhooks/newsletter';

    v_request_id := net.http_post(
      url := v_url,
      body := jsonb_build_object('record', row_to_json(publication)),
      headers := v_headers,
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    -- Do not include the URL, headers, or provider error text in logs.
    RAISE WARNING 'Newsletter webhook dispatch skipped (SQLSTATE %).', SQLSTATE;
  END;

  UPDATE public.newsletter_dispatches
  SET request_id = v_request_id,
      status = CASE WHEN v_request_id IS NOT NULL THEN 'dispatched'
                    WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
      next_attempt_at = CASE WHEN v_request_id IS NULL AND attempts >= 5 THEN NULL
                            ELSE next_attempt_at END
  WHERE publication_id = publication.id;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_newsletter_webhook(public.publications)
  FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
