-- Run with `supabase test db`. Verifies final-schema RBAC tables, seed data,
-- helpers, quotas, RLS, and last-admin guard.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

-- ============================================================================
-- Slice 1: Catalog tables, seeds, FKs, backfill & legacy role sync trigger
-- ============================================================================

SELECT has_table('public', 'roles', 'roles table exists');
SELECT has_table('public', 'role_permissions', 'role_permissions table exists');
SELECT has_table('public', 'user_roles', 'user_roles table exists');
SELECT has_index('public', 'user_roles', 'idx_user_roles_role_id', 'idx_user_roles_role_id exists');

-- 5 canonical roles with expected is_public and public_priority
SELECT results_eq(
  $$SELECT id, is_public, public_priority FROM public.roles ORDER BY id$$,
  $$VALUES
    ('admin'::text, false, NULL::integer),
    ('founder'::text, true, 1),
    ('guest'::text, true, 3),
    ('member'::text, true, 2),
    ('reader'::text, false, NULL::integer)$$,
  'roles table seeds all 5 roles with correct is_public and public_priority'
);

-- 19 atomic permissions seeded accurately across roles
SELECT is(
  (SELECT count(DISTINCT permission) FROM public.role_permissions),
  19::bigint,
  'exactly 19 distinct atomic permissions are seeded'
);

SELECT is(
  (SELECT array_agg(permission ORDER BY permission) FROM public.role_permissions WHERE role_id = 'reader'),
  NULL::text[],
  'reader role has 0 permissions'
);

SELECT is(
  (SELECT array_agg(permission ORDER BY permission) FROM public.role_permissions WHERE role_id = 'guest'),
  ARRAY[
    'ai:translate',
    'desk:access',
    'media:upload_publication',
    'publications:create',
    'publications:delete_own',
    'publications:update_own',
    'tags:create'
  ]::text[],
  'guest role has exact 7 permissions'
);

SELECT is(
  (SELECT array_agg(permission ORDER BY permission) FROM public.role_permissions WHERE role_id = 'member'),
  ARRAY[
    'ai:translate',
    'desk:access',
    'media:upload_publication',
    'publications:create',
    'publications:delete_own',
    'publications:update_own',
    'publications:write_unlimited',
    'tags:create'
  ]::text[],
  'member role has guest permissions plus publications:write_unlimited (8 total)'
);

SELECT is(
  (SELECT array_agg(permission ORDER BY permission) FROM public.role_permissions WHERE role_id = 'founder'),
  ARRAY[
    'ai:translate',
    'comments:delete_any',
    'desk:access',
    'media:delete_any',
    'media:upload_publication',
    'publications:create',
    'publications:delete_any',
    'publications:delete_own',
    'publications:pin',
    'publications:publish',
    'publications:review',
    'publications:update_any',
    'publications:update_own',
    'publications:write_unlimited',
    'tags:create',
    'tags:delete',
    'tags:update'
  ]::text[],
  'founder role has exact 17 permissions'
);

SELECT is(
  (SELECT array_agg(permission ORDER BY permission) FROM public.role_permissions WHERE role_id = 'admin'),
  ARRAY[
    'ai:translate',
    'comments:delete_any',
    'desk:access',
    'media:delete_any',
    'media:upload_publication',
    'publications:create',
    'publications:delete_any',
    'publications:delete_own',
    'publications:pin',
    'publications:publish',
    'publications:review',
    'publications:update_any',
    'publications:update_own',
    'publications:write_unlimited',
    'tags:create',
    'tags:delete',
    'tags:update',
    'users:assign_role',
    'users:revoke_role'
  ]::text[],
  'admin role has all 19 permissions'
);

-- Seeded users check: every seeded public.users row has at least one role in user_roles
SELECT is(
  (
    SELECT count(*)
    FROM public.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id
    )
  ),
  0::bigint,
  'all seeded public.users rows have an assignment in public.user_roles'
);

-- RESTRICT FK on role_id blocks deleting an in-use role
SELECT throws_ok(
  $$DELETE FROM public.roles WHERE id = 'reader'$$,
  '23503',
  NULL,
  'deleting an assigned role from public.roles is rejected by RESTRICT FK'
);

-- Deleting public.users row cascades to public.user_roles
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('30000000-0000-0000-0000-000000000001', 'rbac-cascade-test@example.test', '{"full_name":"RBAC Cascade"}');
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('30000000-0000-0000-0000-000000000001', 'guest')
ON CONFLICT (user_id, role_id) DO NOTHING;

DELETE FROM public.users WHERE id = '30000000-0000-0000-0000-000000000001';
SELECT is(
  (SELECT count(*) FROM public.user_roles WHERE user_id = '30000000-0000-0000-0000-000000000001'),
  0::bigint,
  'deleting public.users row cascades to public.user_roles'
);

-- ============================================================================
-- Slice 2: has_permission(), is_public_role(), zero-role fail-closed, signup
-- ============================================================================

-- Helper function existence and null/anon behavior
SELECT is(
  public.is_public_role('founder'),
  true,
  'is_public_role returns true for founder'
);
SELECT is(
  public.is_public_role('admin'),
  false,
  'is_public_role returns false for admin'
);
SELECT is(
  public.is_public_role('reader'),
  false,
  'is_public_role returns false for reader'
);

-- Create a new user via auth.users to verify handle_new_user() inserts 'reader' in user_roles
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('30000000-0000-0000-0000-000000000002', 'rbac-signup@example.test', '{"full_name":"RBAC Signup"}');

SELECT results_eq(
  $$SELECT role_id FROM public.user_roles WHERE user_id = '30000000-0000-0000-0000-000000000002' ORDER BY role_id$$,
  $$VALUES ('reader'::text)$$,
  'handle_new_user inserts reader role into public.user_roles on signup'
);

-- Zero-role user fails closed on every permission
DELETE FROM public.user_roles WHERE user_id = '30000000-0000-0000-0000-000000000002';

SELECT set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true);

SELECT is(
  (
    SELECT count(*)
    FROM (
      SELECT DISTINCT permission FROM public.role_permissions
    ) p
    WHERE public.has_permission(p.permission) IS DISTINCT FROM FALSE
  ),
  0::bigint,
  'user with zero roles evaluates has_permission() to false for all 19 permissions'
);

-- Immediate grant effect without JWT change
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('30000000-0000-0000-0000-000000000002', 'guest');

SELECT is(public.has_permission('publications:create'), true, 'granting guest immediately enables publications:create');
SELECT is(public.has_permission('publications:write_unlimited'), false, 'guest lacks publications:write_unlimited');

-- Overlapping multi-role union (guest + member)
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('30000000-0000-0000-0000-000000000002', 'member');
SELECT is(public.has_permission('publications:write_unlimited'), true, 'adding member immediately grants publications:write_unlimited');

-- Immediate revocation effect without JWT change
DELETE FROM public.user_roles
WHERE user_id = '30000000-0000-0000-0000-000000000002' AND role_id = 'member';
SELECT is(public.has_permission('publications:write_unlimited'), false, 'revoking member immediately removes publications:write_unlimited');
SELECT is(public.has_permission('publications:create'), true, 'remaining guest role retains publications:create');

-- Reset JWT claim state
SELECT set_config('request.jwt.claims', '', true);
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT is(public.has_permission('desk:access'), false, 'anonymous/null auth.uid() evaluates has_permission() to false');

-- ============================================================================
-- Slice 3: check_publication_quotas() & prevent_removing_last_admin_trigger
-- ============================================================================

-- Guest quota enforcement and automatic lift with overlapping member role
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('30000000-0000-0000-0000-000000000003', 'rbac-quota-guest@example.test', '{"full_name":"Quota Guest"}');
DELETE FROM public.user_roles WHERE user_id = '30000000-0000-0000-0000-000000000003';
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('30000000-0000-0000-0000-000000000003', 'guest');

INSERT INTO public.publications (id, author_id, slug, status, original_language, title, content, created_at, updated_at)
VALUES
  ('30000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000003', 'quota-guest-1', 'draft', 'gl', '{"gl":"G1"}', '{"gl":"<p>G1</p>"}', '2020-01-01 00:00:00+00', '2020-01-01 00:00:00+00'),
  ('30000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000003', 'quota-guest-2', 'draft', 'gl', '{"gl":"G2"}', '{"gl":"<p>G2</p>"}', '2020-01-01 00:00:00+00', '2020-01-01 00:00:00+00');

SELECT is(
  (
    SELECT (created_at = now() AND updated_at = now())
    FROM public.publications
    WHERE id = '30000000-0000-0000-0000-000000000101'
  ),
  true,
  'check_publication_quotas preserves UTC now() assignment for created_at and updated_at'
);

-- 3rd publication in same year fails yearly cap for guest
SELECT throws_ok(
  $$
    INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
    VALUES ('30000000-0000-0000-0000-000000000003', 'quota-guest-3-yearly', 'draft', 'gl', '{"gl":"G3"}', '{"gl":"<p>G3</p>"}')
  $$,
  'P0001',
  'Límite anual alcanzado: Un autor invitado no puede crear más de 2 publicaciones este año.',
  'guest lacking publications:write_unlimited is blocked at 2 publications per year'
);

-- Move the 2 existing publications to past years and add 2 more in another past year (4 total, 0 this year)
UPDATE public.publications SET created_at = '2023-06-01 00:00:00+00' WHERE id = '30000000-0000-0000-0000-000000000101';
UPDATE public.publications SET created_at = '2023-06-02 00:00:00+00' WHERE id = '30000000-0000-0000-0000-000000000102';
INSERT INTO public.publications (id, author_id, slug, status, original_language, title, content)
VALUES
  ('30000000-0000-0000-0000-000000000103', '30000000-0000-0000-0000-000000000003', 'quota-guest-3', 'draft', 'gl', '{"gl":"G3"}', '{"gl":"<p>G3</p>"}'),
  ('30000000-0000-0000-0000-000000000104', '30000000-0000-0000-0000-000000000003', 'quota-guest-4', 'draft', 'gl', '{"gl":"G4"}', '{"gl":"<p>G4</p>"}');
UPDATE public.publications SET created_at = '2024-06-01 00:00:00+00' WHERE id = '30000000-0000-0000-0000-000000000103';
UPDATE public.publications SET created_at = '2024-06-02 00:00:00+00' WHERE id = '30000000-0000-0000-0000-000000000104';

-- 5th publication fails total cap for guest
SELECT throws_ok(
  $$
    INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
    VALUES ('30000000-0000-0000-0000-000000000003', 'quota-guest-5-total', 'draft', 'gl', '{"gl":"G5"}', '{"gl":"<p>G5</p>"}')
  $$,
  'P0001',
  'Límite total alcanzado: Un autor invitado no puede crear más de 4 publicaciones en total.',
  'guest lacking publications:write_unlimited is blocked at 4 total publications'
);

-- Adding overlapping member role lifts quota immediately (guest + member)
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('30000000-0000-0000-0000-000000000003', 'member');

SELECT lives_ok(
  $$
    INSERT INTO public.publications (id, author_id, slug, status, original_language, title, content)
    VALUES
      ('30000000-0000-0000-0000-000000000105', '30000000-0000-0000-0000-000000000003', 'quota-lifted-5', 'draft', 'gl', '{"gl":"G5"}', '{"gl":"<p>G5</p>"}'),
      ('30000000-0000-0000-0000-000000000106', '30000000-0000-0000-0000-000000000003', 'quota-lifted-6', 'draft', 'gl', '{"gl":"G6"}', '{"gl":"<p>G6</p>"}'),
      ('30000000-0000-0000-0000-000000000107', '30000000-0000-0000-0000-000000000003', 'quota-lifted-7', 'draft', 'gl', '{"gl":"G7"}', '{"gl":"<p>G7</p>"}')
  $$,
  'overlapping guest + member grants publications:write_unlimited and lifts both yearly and total caps'
);

-- Revoking member re-enforces cap
DELETE FROM public.user_roles
WHERE user_id = '30000000-0000-0000-0000-000000000003' AND role_id = 'member';

SELECT throws_ok(
  $$
    INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
    VALUES ('30000000-0000-0000-0000-000000000003', 'quota-reimposed', 'draft', 'gl', '{"gl":"G8"}', '{"gl":"<p>G8</p>"}')
  $$,
  'P0001',
  NULL,
  'revoking member re-enforces quota cap for remaining guest role'
);

-- Zero-role user also subject to quota (lacks publications:write_unlimited)
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('30000000-0000-0000-0000-000000000009', 'rbac-quota-zero@example.test', '{"full_name":"Quota Zero"}');
DELETE FROM public.user_roles WHERE user_id = '30000000-0000-0000-0000-000000000009';
SELECT is(
  (SELECT count(*) FROM public.user_roles WHERE user_id = '30000000-0000-0000-0000-000000000009'),
  0::bigint,
  'zero-role quota fixture has no user_roles rows'
);

INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
VALUES
  ('30000000-0000-0000-0000-000000000009', 'quota-zero-1', 'draft', 'gl', '{"gl":"Z1"}', '{"gl":"<p>Z1</p>"}'),
  ('30000000-0000-0000-0000-000000000009', 'quota-zero-2', 'draft', 'gl', '{"gl":"Z2"}', '{"gl":"<p>Z2</p>"}');
SELECT throws_ok(
  $$
    INSERT INTO public.publications (author_id, slug, status, original_language, title, content)
    VALUES ('30000000-0000-0000-0000-000000000009', 'quota-zero-3', 'draft', 'gl', '{"gl":"Z3"}', '{"gl":"<p>Z3</p>"}')
  $$,
  'P0001',
  NULL,
  'zero-role author lacking publications:write_unlimited is subject to quota'
);

-- Last-admin protection trigger
-- Seeded DB has exactly one admin: 89439c6c-d0f0-42ff-9734-f346dc023f68
SELECT is(
  (SELECT count(*) FROM public.user_roles WHERE role_id = 'admin'),
  1::bigint,
  'seeded DB starts with 1 admin assignment'
);

SELECT throws_ok(
  $$DELETE FROM public.user_roles WHERE user_id = '89439c6c-d0f0-42ff-9734-f346dc023f68' AND role_id = 'admin'$$,
  'P0001',
  NULL,
  'deleting the last admin row in user_roles is blocked'
);

SELECT throws_ok(
  $$UPDATE public.user_roles SET role_id = 'founder' WHERE user_id = '89439c6c-d0f0-42ff-9734-f346dc023f68' AND role_id = 'admin'$$,
  'P0001',
  NULL,
  'mutating the last admin row away from admin is blocked'
);

SELECT throws_ok(
  $$DELETE FROM public.users WHERE id = '89439c6c-d0f0-42ff-9734-f346dc023f68'$$,
  'P0001',
  NULL,
  'cascade delete of the last admin user is also blocked'
);

-- Granting a second admin allows removing one admin, then blocks removing the remaining one
INSERT INTO public.user_roles (user_id, role_id)
VALUES ('30000000-0000-0000-0000-000000000003', 'admin');

SELECT lives_ok(
  $$DELETE FROM public.user_roles WHERE user_id = '30000000-0000-0000-0000-000000000003' AND role_id = 'admin'$$,
  'deleting one admin succeeds when another admin remains'
);

SELECT throws_ok(
  $$DELETE FROM public.user_roles WHERE user_id = '89439c6c-d0f0-42ff-9734-f346dc023f68' AND role_id = 'admin'$$,
  'P0001',
  NULL,
  'deleting the remaining last admin after revoking the second admin is blocked'
);

-- ============================================================================
-- Slice 4: Grants & RLS on roles, role_permissions, and user_roles
-- ============================================================================

-- Table privilege hygiene
SELECT ok(has_table_privilege('anon', 'public.roles', 'SELECT'), 'anon can SELECT roles');
SELECT ok(NOT has_table_privilege('anon', 'public.roles', 'INSERT,UPDATE,DELETE'), 'anon cannot mutate roles');
SELECT ok(NOT has_table_privilege('anon', 'public.role_permissions', 'SELECT,INSERT,UPDATE,DELETE'), 'anon has no privileges on role_permissions');
SELECT ok(has_table_privilege('anon', 'public.user_roles', 'SELECT'), 'anon can SELECT user_roles');
SELECT ok(NOT has_table_privilege('anon', 'public.user_roles', 'INSERT,UPDATE,DELETE'), 'anon cannot mutate user_roles');

SELECT ok(has_table_privilege('authenticated', 'public.roles', 'SELECT'), 'authenticated can SELECT roles');
SELECT ok(NOT has_table_privilege('authenticated', 'public.roles', 'INSERT,UPDATE,DELETE'), 'authenticated cannot mutate roles');
SELECT ok(has_table_privilege('authenticated', 'public.role_permissions', 'SELECT'), 'authenticated can SELECT role_permissions');
SELECT ok(NOT has_table_privilege('authenticated', 'public.role_permissions', 'INSERT,UPDATE,DELETE'), 'authenticated cannot mutate role_permissions');
SELECT ok(
  has_table_privilege('authenticated', 'public.user_roles', 'SELECT')
  AND has_table_privilege('authenticated', 'public.user_roles', 'INSERT')
  AND has_table_privilege('authenticated', 'public.user_roles', 'DELETE'),
  'authenticated has SELECT, INSERT, and DELETE on user_roles'
);
SELECT ok(NOT has_table_privilege('authenticated', 'public.user_roles', 'UPDATE'), 'authenticated cannot UPDATE user_roles directly');

-- Custom split-permission roles for testing granular users:assign_role vs users:revoke_role RLS
INSERT INTO public.roles (id, is_public, public_priority)
VALUES
  ('test_assigner', false, NULL),
  ('test_revoker', false, NULL);
INSERT INTO public.role_permissions (role_id, permission)
VALUES
  ('test_assigner', 'users:assign_role'),
  ('test_revoker', 'users:revoke_role');

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('30000000-0000-0000-0000-000000000004', 'rbac-assigner@example.test', '{"full_name":"Assigner"}'),
  ('30000000-0000-0000-0000-000000000005', 'rbac-revoker@example.test', '{"full_name":"Revoker"}');
DELETE FROM public.user_roles WHERE user_id IN ('30000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005');
INSERT INTO public.user_roles (user_id, role_id)
VALUES
  ('30000000-0000-0000-0000-000000000004', 'test_assigner'),
  ('30000000-0000-0000-0000-000000000005', 'test_revoker');

-- Impersonate anon: sees only is_public = true rows in roles and user_roles (no recursion)
SET LOCAL ROLE anon;
SELECT results_eq(
  $$SELECT id FROM public.roles ORDER BY id$$,
  $$VALUES ('founder'::text), ('guest'::text), ('member'::text)$$,
  'anon RLS on roles exposes only is_public=true roles'
);
SELECT is(
  (SELECT count(*) FROM public.user_roles WHERE role_id IN ('admin', 'reader', 'test_assigner', 'test_revoker')),
  0::bigint,
  'anon RLS on user_roles hides admin, reader, and internal roles'
);
SELECT ok(
  (SELECT count(*) FROM public.user_roles WHERE role_id IN ('founder', 'member', 'guest')) > 0,
  'anon RLS on user_roles exposes public roles'
);
RESET ROLE;

-- Impersonate reader (e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3): sees public + own reader role, no admin
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.sub', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', true);

SELECT results_eq(
  $$SELECT id FROM public.roles ORDER BY id$$,
  $$VALUES ('founder'::text), ('guest'::text), ('member'::text), ('reader'::text)$$,
  'authenticated reader sees public roles and own reader role, hiding admin'
);
SELECT is(
  (SELECT count(*) FROM public.user_roles WHERE role_id = 'admin'),
  0::bigint,
  'authenticated reader cannot see admin rows in user_roles'
);
SELECT is(
  (SELECT count(*) FROM public.role_permissions),
  0::bigint,
  'authenticated reader sees 0 rows in role_permissions'
);
SELECT throws_ok(
  $$INSERT INTO public.user_roles (user_id, role_id) VALUES ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'guest')$$,
  '42501',
  NULL,
  'authenticated reader cannot INSERT into user_roles'
);
RESET ROLE;

-- Impersonate test_assigner: can INSERT into user_roles, cannot DELETE
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000004', true);

SELECT lives_ok(
  $$INSERT INTO public.user_roles (user_id, role_id) VALUES ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'guest')$$,
  'user with users:assign_role can INSERT into user_roles'
);
DELETE FROM public.user_roles WHERE user_id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' AND role_id = 'guest';
RESET ROLE;

SELECT is(
  (SELECT count(*) FROM public.user_roles WHERE user_id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' AND role_id = 'guest'),
  1::bigint,
  'user without users:revoke_role cannot DELETE assigned role'
);

-- Impersonate test_revoker: cannot INSERT, can DELETE
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000005', true);

SELECT throws_ok(
  $$INSERT INTO public.user_roles (user_id, role_id) VALUES ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'member')$$,
  '42501',
  NULL,
  'user without users:assign_role cannot INSERT into user_roles'
);
DELETE FROM public.user_roles WHERE user_id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' AND role_id = 'guest';
RESET ROLE;

SELECT is(
  (SELECT count(*) FROM public.user_roles WHERE user_id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' AND role_id = 'guest'),
  0::bigint,
  'user with users:revoke_role can DELETE from user_roles'
);

SELECT * FROM finish();
ROLLBACK;
