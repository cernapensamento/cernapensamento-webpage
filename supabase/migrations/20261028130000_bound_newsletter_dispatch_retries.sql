-- Keep webhook delivery separate from the handler's newsletter_sent_at claim.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE public.newsletter_dispatches (
  publication_id uuid PRIMARY KEY REFERENCES public.publications(id) ON DELETE CASCADE,
  request_id bigint,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'dispatched', 'claimed', 'completed', 'failed')),
  next_attempt_at timestamptz DEFAULT now(),
  last_status_code integer
);

-- Internal delivery bookkeeping must not be writable through the Data API.
ALTER TABLE public.newsletter_dispatches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.newsletter_dispatches FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.newsletter_dispatches TO service_role;
CREATE INDEX newsletter_dispatches_due_idx ON public.newsletter_dispatches(next_attempt_at)
  WHERE status IN ('pending', 'dispatched');

-- Callers lock the publication first, then its dispatch row, in that order.
CREATE FUNCTION public.dispatch_newsletter_webhook(publication public.publications)
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
    v_secret := current_setting('app.settings.webhook_secret', true);
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

CREATE OR REPLACE FUNCTION public.trigger_publication_published_newsletter()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.newsletter_sent_at IS DISTINCT FROM OLD.newsletter_sent_at THEN
      -- Observe claims even if the handler releases them before pg_net responds.
      -- Retained claims (including partial email success) are never retried.
      IF NEW.newsletter_sent_at IS NULL THEN
        -- Also handle a claim made by a webhook already in flight at migration time.
        INSERT INTO public.newsletter_dispatches (publication_id) VALUES (NEW.id)
        ON CONFLICT (publication_id) DO NOTHING;
      END IF;
      UPDATE public.newsletter_dispatches
      SET status = CASE WHEN NEW.newsletter_sent_at IS NOT NULL THEN 'claimed'
                        WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
          next_attempt_at = CASE WHEN NEW.newsletter_sent_at IS NOT NULL OR attempts >= 5 THEN NULL
                                ELSE now() + interval '1 minute' * power(2, greatest(attempts - 1, 0)) END
      WHERE publication_id = NEW.id;
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM 'published' OR NEW.newsletter_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.newsletter_dispatches (publication_id) VALUES (NEW.id)
  ON CONFLICT (publication_id) DO NOTHING;
  IF FOUND THEN
    PERFORM public.dispatch_newsletter_webhook(NEW);
  END IF;
  -- Ordinary edits and republishing cannot reset the retry budget or backoff.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_publication_published_newsletter ON public.publications;
CREATE TRIGGER on_publication_published_newsletter
  AFTER INSERT OR UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.trigger_publication_published_newsletter();

CREATE FUNCTION public.reconcile_newsletter_dispatches()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_publication public.publications;
  v_dispatch public.newsletter_dispatches;
  v_response net._http_response;
BEGIN
  -- SKIP LOCKED allows concurrent runs without duplicating sends or blocking claims.
  FOR v_publication IN
    SELECT p.* FROM public.publications p
    JOIN public.newsletter_dispatches d ON d.publication_id = p.id
    WHERE p.status = 'published' AND p.newsletter_sent_at IS NULL
      AND d.status IN ('pending', 'dispatched') AND d.next_attempt_at <= now()
    ORDER BY d.next_attempt_at, p.id
    LIMIT 100
    FOR UPDATE OF p SKIP LOCKED
  LOOP
    SELECT * INTO v_dispatch FROM public.newsletter_dispatches
    WHERE publication_id = v_publication.id FOR UPDATE;

    IF v_dispatch.status = 'dispatched' THEN
      SELECT * INTO v_response FROM net._http_response WHERE id = v_dispatch.request_id;
      IF FOUND THEN
        UPDATE public.newsletter_dispatches SET last_status_code = v_response.status_code
        WHERE publication_id = v_publication.id;
        IF v_response.status_code BETWEEN 200 AND 299
           AND NOT COALESCE(v_response.timed_out, false) AND v_response.error_msg IS NULL THEN
          UPDATE public.newsletter_dispatches SET status = 'completed', next_attempt_at = NULL
          WHERE publication_id = v_publication.id;
          CONTINUE;
        END IF;
      ELSIF EXISTS (SELECT 1 FROM net.http_request_queue WHERE id = v_dispatch.request_id) THEN
        -- A stalled worker must not accumulate copies of the same queued request.
        CONTINUE;
      END IF;
      -- Missing/expired responses and transport/non-2xx failures retry only after backoff.
    END IF;

    IF v_dispatch.attempts >= 5 THEN
      UPDATE public.newsletter_dispatches SET status = 'failed', next_attempt_at = NULL
      WHERE publication_id = v_publication.id;
    ELSE
      PERFORM public.dispatch_newsletter_webhook(v_publication);
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_newsletter_dispatches()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_newsletter_dispatches() TO service_role;

SELECT cron.schedule('reconcile-newsletter-dispatches', '* * * * *',
  'SELECT public.reconcile_newsletter_dispatches()');

COMMIT;
