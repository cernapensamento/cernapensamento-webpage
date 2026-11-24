-- Run with `supabase test db`. Verifies monolingual, bilingual, draft, and invalid
-- publication CHECK constraints directly against PostgreSQL.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('20000000-0000-0000-0000-000000000001', 'monolingual-test@example.test',
        '{"full_name":"Monolingual Test"}');
INSERT INTO public.users (id, full_name)
VALUES ('20000000-0000-0000-0000-000000000001', 'Monolingual Test')
ON CONFLICT (id) DO NOTHING;

-- 1. Galician-only published publication succeeds
SELECT lives_ok($$
  INSERT INTO public.publications (author_id, slug, status, original_language, title, subtitle, content)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'mono-gl-published',
    'published',
    'gl',
    '{"gl":"Ensaio en galego"}',
    '{"gl":"Subtítulo"}',
    '{"gl":"<p>Contido en galego</p>"}'
  );
$$, 'gl-only published publication is accepted');

-- 2. Spanish-only in_review publication succeeds with NULL subtitle
SELECT lives_ok($$
  INSERT INTO public.publications (author_id, slug, status, original_language, title, subtitle, content)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'mono-es-review',
    'in_review',
    'es',
    '{"es":"Ensayo en español"}',
    NULL,
    '{"es":"<p>Contenido en español</p>"}'
  );
$$, 'es-only in_review publication with NULL subtitle is accepted');

-- 3. Bilingual published publication succeeds
SELECT lives_ok($$
  INSERT INTO public.publications (author_id, slug, status, original_language, title, subtitle, content)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'bilingual-published',
    'published',
    'gl',
    '{"gl":"Título GL","es":"Título ES"}',
    '{}',
    '{"gl":"<p>GL</p>","es":"<p>ES</p>"}'
  );
$$, 'bilingual published publication with empty subtitle object is accepted');

-- 4. Draft with title only in one language succeeds
SELECT lives_ok($$
  INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'draft-title-only-es',
    'draft',
    'es',
    '{"es":"Borrador solo título"}',
    '{}'
  );
$$, 'draft with title only in es is accepted');

-- 5. Draft with content only in one language (untitled) succeeds
SELECT lives_ok($$
  INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'draft-content-only-gl',
    'draft',
    'gl',
    '{}',
    '{"gl":"<p>Borrador sen título</p>"}'
  );
$$, 'draft with content only in gl is accepted');

-- 6. Reject published row missing original_language title
SELECT throws_ok($$
  INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'invalid-published-missing-orig',
    'published',
    'es',
    '{"gl":"Só galego"}',
    '{"gl":"<p>Só galego</p>"}'
  );
$$, '23514', NULL, 'published row with mismatched original_language is rejected');

-- 7. Reject published row with half-filled second locale (title without content)
SELECT throws_ok($$
  INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'invalid-published-half-es',
    'published',
    'gl',
    '{"gl":"Título GL","es":"Título ES"}',
    '{"gl":"<p>Contido GL</p>"}'
  );
$$, '23514', NULL, 'published row with half-filled second locale is rejected');

-- 8. Reject in_review row with empty content in original_language
SELECT throws_ok($$
  INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'invalid-review-empty-content',
    'in_review',
    'gl',
    '{"gl":"Título GL"}',
    '{"gl":"   "}'
  );
$$, '23514', NULL, 'in_review row with blank content in original_language is rejected');

-- 9. Reject draft with neither title nor content
SELECT throws_ok($$
  INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'invalid-empty-draft',
    'draft',
    'gl',
    '{}',
    '{}'
  );
$$, '23514', NULL, 'completely empty draft is rejected');

SELECT * FROM finish();
ROLLBACK;
