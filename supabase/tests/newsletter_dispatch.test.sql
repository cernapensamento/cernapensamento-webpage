-- Run with `supabase test db`. All requests stay uncommitted and roll back;
-- no real webhook or email provider is contacted.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT no_plan();
SET LOCAL app.settings.webhook_secret = 'synthetic-newsletter-test-secret';
SET LOCAL app.settings.site_url = 'https://newsletter.example.test';

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('10000000-0000-0000-0000-000000000001', 'newsletter-test@example.test',
        '{"full_name":"Newsletter Test"}');
INSERT INTO public.users (id, full_name)
VALUES ('10000000-0000-0000-0000-000000000001', 'Newsletter Test')
ON CONFLICT (id) DO NOTHING;

CREATE FUNCTION pg_temp.new_publication(label text) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.publications (author_id, slug, status, title, content)
  VALUES ('10000000-0000-0000-0000-000000000001', 'newsletter-test-' || label,
          'published', '{"gl":"Proba","es":"Prueba"}', '{"gl":"Proba","es":"Prueba"}')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE TEMP TABLE fixtures AS
SELECT label, pg_temp.new_publication(label) AS id
FROM unnest(ARRAY['released', 'preclaim', 'success', 'stalled', 'timeout', 'lost', 'draft', 'completed']) AS label;

SELECT is(d.attempts, 1, 'initial publication dispatches once')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';
SELECT ok(d.request_id IS NOT NULL AND d.status = 'dispatched', 'request ID and dispatch state are persisted')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';
SELECT ok(d.next_attempt_at = now() + interval '1 minute', 'first backoff is one minute')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';
SELECT is(q.url, 'https://newsletter.example.test/api/webhooks/newsletter', 'HTTPS URL behavior is preserved')
FROM net.http_request_queue q JOIN newsletter_dispatches d ON q.id = d.request_id
JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';
SELECT is(convert_from(q.body, 'UTF8')::jsonb -> 'record' ->> 'id', f.id::text, 'payload preserves the record wrapper')
FROM net.http_request_queue q JOIN newsletter_dispatches d ON q.id = d.request_id
JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';
SELECT is(q.headers ->> 'Authorization', 'Bearer synthetic-newsletter-test-secret', 'HTTPS request includes authorization')
FROM net.http_request_queue q JOIN newsletter_dispatches d ON q.id = d.request_id
JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';

UPDATE publications SET newsletter_sent_at = now() WHERE id = (SELECT id FROM fixtures WHERE label = 'released');
SELECT is(d.status, 'claimed', 'handler claim is observed before its response arrives')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';
UPDATE publications SET newsletter_sent_at = NULL WHERE id = (SELECT id FROM fixtures WHERE label = 'released');
SELECT ok(d.status = 'pending' AND d.attempts = 1 AND d.next_attempt_at > now(),
          'claim release defers retry without posting immediately')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';
UPDATE publications SET title = '{"gl":"Editado","es":"Editado"}' WHERE id = (SELECT id FROM fixtures WHERE label = 'released');
SELECT public.reconcile_newsletter_dispatches();
SELECT is(d.attempts, 1, 'edits and early reconciliation do not bypass backoff')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';

-- Keep the released-claim path independent of the eventual HTTP status.
INSERT INTO net._http_response (id, status_code)
SELECT d.request_id, 200 FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';
UPDATE newsletter_dispatches SET next_attempt_at = now() WHERE publication_id = (SELECT id FROM fixtures WHERE label = 'released');
SELECT public.reconcile_newsletter_dispatches();
SELECT ok(d.attempts = 2 AND d.status = 'dispatched' AND d.next_attempt_at = now() + interval '2 minutes',
          'released claim retries after backoff even with a stale 2xx response')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';

-- Inject pre-claim outcomes into pg_net's real response table.
INSERT INTO net._http_response (id, status_code, timed_out, error_msg)
SELECT d.request_id,
       CASE WHEN f.label IN ('preclaim', 'draft') THEN 503 WHEN f.label = 'completed' THEN 204 ELSE NULL END,
       f.label = 'timeout', CASE WHEN f.label = 'timeout' THEN 'synthetic transport timeout' END
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id
WHERE f.label IN ('preclaim', 'draft', 'timeout', 'completed');
DELETE FROM net.http_request_queue WHERE id IN (
  SELECT d.request_id FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id
  WHERE f.label IN ('preclaim', 'draft', 'timeout', 'lost', 'completed')
);
UPDATE publications SET newsletter_sent_at = now() WHERE id = (SELECT id FROM fixtures WHERE label = 'success');
UPDATE publications SET status = 'draft' WHERE id = (SELECT id FROM fixtures WHERE label = 'draft');
UPDATE newsletter_dispatches SET next_attempt_at = now()
WHERE publication_id IN (SELECT id FROM fixtures WHERE label <> 'released');
CREATE TEMP TABLE old_requests AS SELECT publication_id, request_id FROM newsletter_dispatches;
SELECT public.reconcile_newsletter_dispatches();
SELECT ok(d.attempts = 2 AND d.request_id <> o.request_id AND d.last_status_code = 503,
          'pre-claim non-2xx is reconciled with a new request ID')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id
JOIN old_requests o USING (publication_id) WHERE f.label = 'preclaim';
SELECT is(d.attempts, 2, 'transport timeout before claiming is retried')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'timeout';
SELECT is(d.attempts, 2, 'lost or expired pg_net response is retried')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'lost';
SELECT is(d.attempts, 1, 'still queued request does not accumulate duplicates')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'stalled';
SELECT ok(d.attempts = 1 AND d.status = 'claimed', 'retained handler claim is never retried')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'success';
SELECT is(d.attempts, 1, 'unpublished publication is not retried')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'draft';
SELECT ok(d.attempts = 1 AND d.status = 'completed' AND d.next_attempt_at IS NULL,
          'successful response completes delivery without retry')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'completed';

-- Persistent pre-claim failures exhaust the same budget as released claims.
DO $$
BEGIN
  FOR attempt IN 3..6 LOOP
    DELETE FROM net.http_request_queue WHERE id IN (
      SELECT d.request_id FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id
      WHERE f.label IN ('released', 'preclaim')
    );
    INSERT INTO net._http_response (id, status_code)
    SELECT d.request_id, 500 FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id
    WHERE f.label IN ('released', 'preclaim') AND d.status = 'dispatched';
    UPDATE newsletter_dispatches SET next_attempt_at = now()
    WHERE publication_id IN (SELECT id FROM fixtures WHERE label IN ('released', 'preclaim'));
    PERFORM public.reconcile_newsletter_dispatches();
  END LOOP;
END;
$$;
SELECT ok(d.attempts = 5 AND d.status = 'failed' AND d.next_attempt_at IS NULL,
          'persistent pre-claim failures stop at five attempts')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'preclaim';
UPDATE publications SET newsletter_sent_at = now() WHERE id = (SELECT id FROM fixtures WHERE label = 'released');
UPDATE publications SET newsletter_sent_at = NULL WHERE id = (SELECT id FROM fixtures WHERE label = 'released');
UPDATE publications SET status = 'draft' WHERE id = (SELECT id FROM fixtures WHERE label = 'released');
UPDATE publications SET status = 'published' WHERE id = (SELECT id FROM fixtures WHERE label = 'released');
SELECT public.reconcile_newsletter_dispatches();
SELECT ok(d.attempts = 5 AND d.status = 'failed' AND d.next_attempt_at IS NULL,
          'claim release and republishing cannot restart an exhausted budget')
FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'released';

-- Repeated claim/release failures also use increasing delays and the same cap.
SELECT pg_temp.new_publication('claim-loop') AS id INTO TEMP TABLE claim_loop;
DO $$
BEGIN
  FOR attempt IN 1..5 LOOP
    UPDATE publications SET newsletter_sent_at = now() WHERE id = (SELECT id FROM claim_loop);
    UPDATE publications SET newsletter_sent_at = NULL WHERE id = (SELECT id FROM claim_loop);
    IF attempt < 5 THEN
      UPDATE newsletter_dispatches SET next_attempt_at = now() WHERE publication_id = (SELECT id FROM claim_loop);
      PERFORM public.reconcile_newsletter_dispatches();
    END IF;
  END LOOP;
END;
$$;
SELECT ok(attempts = 5 AND status = 'failed' AND next_attempt_at IS NULL, 'persistent handler failures stop at five attempts')
FROM newsletter_dispatches WHERE publication_id = (SELECT id FROM claim_loop);

-- An old in-flight webhook may have claimed before dispatch tracking was installed.
INSERT INTO publications (author_id, slug, status, title, content, newsletter_sent_at)
VALUES ('10000000-0000-0000-0000-000000000001', 'newsletter-test-legacy', 'published',
        '{"gl":"Proba","es":"Prueba"}', '{"gl":"Proba","es":"Prueba"}', now());
SELECT is((SELECT count(*) FROM newsletter_dispatches d JOIN publications p ON d.publication_id = p.id
           WHERE p.slug = 'newsletter-test-legacy'), 0::bigint, 'previously claimed publication is not dispatched');
UPDATE publications SET newsletter_sent_at = NULL WHERE slug = 'newsletter-test-legacy';
SELECT ok(d.attempts = 0 AND d.status = 'pending' AND d.next_attempt_at > now(),
          'legacy claim release joins the bounded queue without an immediate post')
FROM newsletter_dispatches d JOIN publications p ON d.publication_id = p.id WHERE p.slug = 'newsletter-test-legacy';

-- Reject non-HTTPS schemes on the initial send and on retries after a config change.
SET LOCAL app.settings.site_url = 'http://newsletter.example.test';
SELECT pg_temp.new_publication('insecure') AS id INTO TEMP TABLE insecure;
SELECT ok(request_id IS NULL AND status = 'pending' AND attempts = 1, 'HTTP URL is skipped without leaking the secret')
FROM newsletter_dispatches WHERE publication_id = (SELECT id FROM insecure);
SELECT is(count(*), 0::bigint, 'HTTP rejection enqueues no request') FROM net.http_request_queue
WHERE convert_from(body, 'UTF8')::jsonb -> 'record' ->> 'id' = (SELECT id::text FROM insecure);
DELETE FROM net.http_request_queue WHERE id = (
  SELECT d.request_id FROM newsletter_dispatches d JOIN fixtures f ON d.publication_id = f.id WHERE f.label = 'timeout'
);
UPDATE newsletter_dispatches SET next_attempt_at = now() WHERE publication_id = (SELECT id FROM fixtures WHERE label = 'timeout');
SELECT public.reconcile_newsletter_dispatches();
SELECT ok(request_id IS NULL AND status = 'pending' AND attempts = 3, 'retry revalidates HTTPS after configuration changes')
FROM newsletter_dispatches WHERE publication_id = (SELECT id FROM fixtures WHERE label = 'timeout');
SET LOCAL app.settings.site_url = 'ftp://newsletter.example.test';
SELECT pg_temp.new_publication('ftp') AS id INTO TEMP TABLE ftp;
SELECT ok(request_id IS NULL AND attempts = 1, 'other non-HTTPS schemes are skipped')
FROM newsletter_dispatches WHERE publication_id = (SELECT id FROM ftp);
SET LOCAL app.settings.site_url = 'https://newsletter.example.test';
SET LOCAL app.settings.webhook_secret = '';
SELECT pg_temp.new_publication('no-secret') AS id INTO TEMP TABLE no_secret;
SELECT ok(request_id IS NULL AND attempts = 1 AND status = 'pending', 'missing secret skips dispatch and stays bounded')
FROM newsletter_dispatches WHERE publication_id = (SELECT id FROM no_secret);

SELECT ok(NOT has_table_privilege('anon', 'public.newsletter_dispatches', 'SELECT,INSERT,UPDATE,DELETE'), 'anonymous clients cannot access dispatch state');
SELECT ok(NOT has_table_privilege('authenticated', 'public.newsletter_dispatches', 'INSERT,UPDATE,DELETE'), 'authenticated clients cannot reset the budget');
SELECT ok(NOT has_function_privilege('authenticated', 'public.reconcile_newsletter_dispatches()', 'EXECUTE'), 'reconciler is not publicly executable');
SELECT ok(NOT has_function_privilege('service_role', 'public.dispatch_newsletter_webhook(public.publications)', 'EXECUTE'), 'service role cannot bypass reconciliation with a forged publication');
SELECT is((SELECT count(*) FROM cron.job WHERE jobname = 'reconcile-newsletter-dispatches' AND schedule = '* * * * *'),
          1::bigint, 'reconciliation is scheduled once per minute');
SELECT * FROM finish();
ROLLBACK;
