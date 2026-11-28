-- Run with `supabase test db`. Verifies Ticket 07 contract-phase RBAC cleanup:
-- legacy single-role column, enum, triggers, and helpers are removed;
-- seed users have canonical user_roles and no JWT user_role claims;
-- anon column grants on public.users exclude role and include slug.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

-- 1. Legacy column and enum type removed
SELECT hasnt_column('public', 'users', 'role', 'public.users.role column is dropped');
SELECT hasnt_type('public', 'user_role', 'public.user_role enum type is dropped');

-- 2. Legacy triggers on public.users removed
SELECT hasnt_trigger('public', 'users', 'on_legacy_user_role_sync', 'on_legacy_user_role_sync trigger is dropped');
SELECT hasnt_trigger('public', 'users', 'on_user_role_changed', 'on_user_role_changed trigger is dropped');

-- 3. Legacy functions removed
SELECT hasnt_function('public', 'sync_legacy_user_role_to_user_roles', 'sync_legacy_user_role_to_user_roles() is dropped');
SELECT hasnt_function('public', 'sync_user_role_to_auth', 'sync_user_role_to_auth() is dropped');
SELECT hasnt_function('public', 'custom_access_token_hook', ARRAY['jsonb'], 'custom_access_token_hook(jsonb) is dropped');
SELECT hasnt_function('public', 'current_user_role', 'current_user_role() is dropped');
SELECT hasnt_function('public', 'is_operator', 'is_operator() is dropped');
SELECT hasnt_function('public', 'is_writer', 'is_writer() is dropped');

-- 4. Anon column privileges on public.users include public fields (with slug) and exclude newsletter_subscribed
SELECT ok(has_column_privilege('anon', 'public.users', 'id', 'SELECT'), 'anon can SELECT users.id');
SELECT ok(has_column_privilege('anon', 'public.users', 'full_name', 'SELECT'), 'anon can SELECT users.full_name');
SELECT ok(has_column_privilege('anon', 'public.users', 'slug', 'SELECT'), 'anon can SELECT users.slug');
SELECT ok(has_column_privilege('anon', 'public.users', 'bio', 'SELECT'), 'anon can SELECT users.bio');
SELECT ok(has_column_privilege('anon', 'public.users', 'avatar_url', 'SELECT'), 'anon can SELECT users.avatar_url');
SELECT ok(
  NOT has_column_privilege('anon', 'public.users', 'newsletter_subscribed', 'SELECT'),
  'anon cannot SELECT users.newsletter_subscribed'
);

-- 5. Seeded users have canonical user_roles rows and no legacy user_role in raw_app_meta_data
SELECT results_eq(
  $$
    SELECT u.slug, ur.role_id
    FROM public.users u
    JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.id IN (
      'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
      'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
      'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
      'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
      '89439c6c-d0f0-42ff-9734-f346dc023f68',
      'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
      'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
      'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3'
    )
    ORDER BY u.slug, ur.role_id
  $$,
  $$VALUES
    ('admin'::text, 'admin'::text),
    ('anxo-perez'::text, 'founder'::text),
    ('denis-fernandez'::text, 'founder'::text),
    ('diego-araujo'::text, 'founder'::text),
    ('hector-gonzalez'::text, 'founder'::text),
    ('lector-proba'::text, 'reader'::text),
    ('lucia-vazquez'::text, 'guest'::text),
    ('martino-rodriguez'::text, 'member'::text)
  $$,
  'seeded users hold expected canonical roles in public.user_roles'
);

SELECT is(
  (
    SELECT count(*)
    FROM auth.users
    WHERE raw_app_meta_data ? 'user_role'
  ),
  0::bigint,
  'auth.users.raw_app_meta_data contains no user_role claim'
);

-- 6. handle_new_user() creates public.users row (without role column) and assigns reader in user_roles
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('30000000-0000-0000-0000-000000000099', 'contract-signup@example.test', '{"full_name":"Contract Signup"}');

SELECT is(
  (SELECT full_name FROM public.users WHERE id = '30000000-0000-0000-0000-000000000099'),
  'Contract Signup',
  'handle_new_user inserts public.users row without role column'
);
SELECT results_eq(
  $$SELECT role_id FROM public.user_roles WHERE user_id = '30000000-0000-0000-0000-000000000099'$$,
  $$VALUES ('reader'::text)$$,
  'handle_new_user assigns baseline reader role in user_roles'
);

SELECT * FROM finish();
ROLLBACK;
