-- Expand phase for Multi-Role RBAC with atomic resource:action permissions.
-- See docs/adr/0003-multi-role-rbac-permissions.md and .scratch/multi-role-rbac/spec.md.

-- 1. Normalized RBAC catalog and assignment tables
CREATE TABLE public.roles (
  id text PRIMARY KEY,
  is_public boolean NOT NULL DEFAULT false,
  public_priority integer,
  CONSTRAINT roles_id_format_check CHECK (id ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT roles_public_priority_check CHECK (
    (is_public = true AND public_priority IS NOT NULL AND public_priority > 0)
    OR (is_public = false AND public_priority IS NULL)
  ),
  CONSTRAINT roles_public_priority_unique UNIQUE (public_priority)
);

CREATE TABLE public.role_permissions (
  role_id text NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  PRIMARY KEY (role_id, permission),
  CONSTRAINT role_permissions_format_check CHECK (permission ~ '^[a-z0-9_]+:[a-z0-9_]+$')
);

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_role_id ON public.user_roles (role_id);

-- 2. Seed day-1 Roles and 19 atomic Permissions
INSERT INTO public.roles (id, is_public, public_priority)
VALUES
  ('founder', true, 1),
  ('member', true, 2),
  ('guest', true, 3),
  ('admin', false, NULL),
  ('reader', false, NULL)
ON CONFLICT (id) DO UPDATE
SET is_public = EXCLUDED.is_public,
    public_priority = EXCLUDED.public_priority;

WITH guest_permissions(permission) AS (
  VALUES
    ('desk:access'),
    ('ai:translate'),
    ('publications:create'),
    ('publications:update_own'),
    ('publications:delete_own'),
    ('media:upload_publication'),
    ('tags:create')
),
member_permissions(permission) AS (
  SELECT permission FROM guest_permissions
  UNION ALL
  VALUES ('publications:write_unlimited')
),
founder_permissions(permission) AS (
  SELECT permission FROM member_permissions
  UNION ALL
  VALUES
    ('publications:review'),
    ('publications:publish'),
    ('publications:pin'),
    ('publications:update_any'),
    ('publications:delete_any'),
    ('media:delete_any'),
    ('tags:update'),
    ('tags:delete'),
    ('comments:delete_any')
),
admin_permissions(permission) AS (
  SELECT permission FROM founder_permissions
  UNION ALL
  VALUES
    ('users:assign_role'),
    ('users:revoke_role')
)
INSERT INTO public.role_permissions (role_id, permission)
SELECT 'guest', permission FROM guest_permissions
UNION ALL
SELECT 'member', permission FROM member_permissions
UNION ALL
SELECT 'founder', permission FROM founder_permissions
UNION ALL
SELECT 'admin', permission FROM admin_permissions
ON CONFLICT (role_id, permission) DO NOTHING;

-- 3. Backfill existing users into user_roles and keep legacy users.role synced during expand phase
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, u.role::text
FROM public.users u
WHERE u.role IS NOT NULL
ON CONFLICT (user_id, role_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_legacy_user_role_to_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, NEW.role::text)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role AND OLD.role IS NOT NULL THEN
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id
      AND role_id = OLD.role::text;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_legacy_user_role_to_user_roles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_legacy_user_role_to_user_roles() TO service_role;

DROP TRIGGER IF EXISTS on_legacy_user_role_sync ON public.users;
CREATE TRIGGER on_legacy_user_role_sync
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_legacy_user_role_to_user_roles();

-- 4. DB-backed authorization helpers (STABLE SECURITY DEFINER, locked search_path)
CREATE OR REPLACE FUNCTION public.has_permission(required_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND rp.permission = required_permission
  );
$$;

REVOKE ALL ON FUNCTION public.has_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_public_role(target_role_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = target_role_id
      AND r.is_public = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_public_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_role(text) TO anon, authenticated, service_role;

-- 5. Update new-user signup trigger to assign baseline 'reader' role in user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, role, newsletter_subscribed)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'nombre',
      'UsuarioNuevo'
    ),
    NEW.raw_user_meta_data ->> 'avatar_url',
    'reader'::public.user_role,
    FALSE
  );

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, 'reader')
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 6. Update publication quota trigger to check publications:write_unlimited
CREATE OR REPLACE FUNCTION public.check_publication_quotas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_has_unlimited boolean;
  v_total_count int;
  v_year_count int;
BEGIN
  -- Always enforce server-authoritative timestamps on publication creation
  NEW.created_at := timezone('utc'::text, now());
  NEW.updated_at := timezone('utc'::text, now());

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = NEW.author_id
      AND rp.permission = 'publications:write_unlimited'
  ) INTO v_has_unlimited;

  IF NOT v_has_unlimited THEN
    SELECT count(*) INTO v_total_count
    FROM public.publications
    WHERE author_id = NEW.author_id;

    IF v_total_count >= 4 THEN
      RAISE EXCEPTION 'Límite total alcanzado: Un autor invitado no puede crear más de 4 publicaciones en total.';
    END IF;

    SELECT count(*) INTO v_year_count
    FROM public.publications
    WHERE author_id = NEW.author_id
      AND extract(year from created_at) = extract(year from NEW.created_at);

    IF v_year_count >= 2 THEN
      RAISE EXCEPTION 'Límite anual alcanzado: Un autor invitado no puede crear más de 2 publicaciones este año.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Guard against removing or mutating away the last admin role assignment
CREATE OR REPLACE FUNCTION public.prevent_removing_last_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.role_id = 'admin' AND (TG_OP = 'DELETE' OR NEW.role_id IS DISTINCT FROM 'admin') THEN
    PERFORM pg_advisory_xact_lock(hashtext('public.user_roles:last_admin'));

    IF NOT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE role_id = 'admin'
        AND user_id <> OLD.user_id
    ) THEN
      RAISE EXCEPTION 'Cannot remove the last remaining admin role assignment.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_removing_last_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_removing_last_admin() TO service_role;

DROP TRIGGER IF EXISTS prevent_removing_last_admin_trigger ON public.user_roles;
CREATE TRIGGER prevent_removing_last_admin_trigger
  BEFORE DELETE OR UPDATE OF role_id ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_removing_last_admin();

-- 8. Privileges & RLS on RBAC tables (roles, role_permissions, user_roles)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Table grants
REVOKE ALL ON TABLE public.roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.roles TO anon, authenticated;
GRANT ALL ON TABLE public.roles TO service_role;

REVOKE ALL ON TABLE public.role_permissions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.role_permissions TO authenticated;
GRANT ALL ON TABLE public.role_permissions TO service_role;

REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;

-- RLS policies: public.roles
CREATE POLICY "Anonymous read public roles"
  ON public.roles
  FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "Authenticated read visible roles"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id = roles.id
    )
    OR public.has_permission('users:assign_role')
    OR public.has_permission('users:revoke_role')
  );

-- RLS policies: public.role_permissions
CREATE POLICY "Authenticated read assigned or manageable role permissions"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id = role_permissions.role_id
    )
    OR public.has_permission('users:assign_role')
    OR public.has_permission('users:revoke_role')
  );

-- RLS policies: public.user_roles
CREATE POLICY "Anonymous read public user roles"
  ON public.user_roles
  FOR SELECT
  TO anon
  USING (public.is_public_role(role_id));

CREATE POLICY "Authenticated read visible user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_public_role(role_id)
    OR public.has_permission('users:assign_role')
    OR public.has_permission('users:revoke_role')
  );

CREATE POLICY "Role managers can assign user roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('users:assign_role'));

CREATE POLICY "Role managers can revoke user roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_permission('users:revoke_role'));
