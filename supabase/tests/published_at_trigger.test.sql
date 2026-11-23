-- Run with `supabase test db`. Verifies published_at trigger enforcement and
-- deterministic/trimmed Vault secret selection in dispatch_newsletter_webhook.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('10000000-0000-0000-0000-000000000021', 'pubdate-test@example.test',
        '{"full_name":"PubDate Test"}');
INSERT INTO public.users (id, full_name)
VALUES ('10000000-0000-0000-0000-000000000021', 'PubDate Test')
ON CONFLICT (id) DO NOTHING;

-- 1. Draft created in the past stays published_at = NULL
INSERT INTO public.publications (id, author_id, slug, status, title, content)
VALUES (
  '10000000-0000-0000-0000-000000000022',
  '10000000-0000-0000-0000-000000000021',
  'pubdate-draft-repro',
  'draft',
  '{"gl":"Borrador","es":"Borrador"}',
  '{"gl":"Texto","es":"Texto"}'
);
UPDATE public.publications
SET created_at = '2026-01-01 10:00:00+00'
WHERE id = '10000000-0000-0000-0000-000000000022';

SELECT is(published_at, NULL, 'draft has NULL published_at')
FROM public.publications WHERE id = '10000000-0000-0000-0000-000000000022';

-- 2. Transitioning draft -> published ignores a stale client-supplied published_at
UPDATE public.publications
SET status = 'published',
    published_at = '2026-01-01 10:00:00+00'
WHERE id = '10000000-0000-0000-0000-000000000022';

SELECT ok(published_at > '2026-01-02 00:00:00+00'::timestamptz,
          'draft -> published stamps real publish time even if caller passed stale published_at')
FROM public.publications WHERE id = '10000000-0000-0000-0000-000000000022';

-- 3. Editing an already-published article preserves its original published_at
CREATE TEMP TABLE original_pub AS
SELECT published_at FROM public.publications WHERE id = '10000000-0000-0000-0000-000000000022';

UPDATE public.publications
SET title = '{"gl":"Editado","es":"Editado"}'
WHERE id = '10000000-0000-0000-0000-000000000022';

SELECT is(p.published_at, o.published_at, 'editing a published article preserves published_at')
FROM public.publications p, original_pub o
WHERE p.id = '10000000-0000-0000-0000-000000000022';

-- 4. Reverting to draft clears published_at
UPDATE public.publications
SET status = 'draft'
WHERE id = '10000000-0000-0000-0000-000000000022';

SELECT is(published_at, NULL, 'reverting to draft clears published_at')
FROM public.publications WHERE id = '10000000-0000-0000-0000-000000000022';

-- 5. dispatch_newsletter_webhook prefers canonical webhook_secret over app.settings.webhook_secret and trims whitespace
SET LOCAL app.settings.webhook_secret = '';
SET LOCAL app.settings.site_url = 'https://newsletter.example.test';
SELECT vault.create_secret('stale-legacy-secret', 'app.settings.webhook_secret', 'legacy');
SELECT vault.create_secret('  canonical-vault-secret  ', 'webhook_secret', 'canonical');

INSERT INTO public.publications (id, author_id, slug, status, title, content)
VALUES (
  '10000000-0000-0000-0000-000000000023',
  '10000000-0000-0000-0000-000000000021',
  'pubdate-vault-order',
  'published',
  '{"gl":"Vault","es":"Vault"}',
  '{"gl":"Texto","es":"Texto"}'
);

SELECT is(q.headers ->> 'Authorization', 'Bearer canonical-vault-secret',
          'Vault lookup prefers webhook_secret over app.settings.webhook_secret and trims whitespace')
FROM net.http_request_queue q
JOIN public.newsletter_dispatches d ON q.id = d.request_id
WHERE d.publication_id = '10000000-0000-0000-0000-000000000023';

SELECT * FROM finish();
ROLLBACK;
