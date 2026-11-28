-- Contract phase for Multi-Role RBAC:
-- Remove legacy single-role column, enum type, JWT role-sync triggers,
-- and legacy role helper functions so roles, role_permissions, and user_roles
-- are the sole source of truth.

-- 1. Drop temporary expand-phase sync trigger and function
DROP TRIGGER IF EXISTS on_legacy_user_role_sync ON public.users;
DROP FUNCTION IF EXISTS public.sync_legacy_user_role_to_user_roles();

-- 2. Update new-user signup trigger to insert into public.users without role
--    and assign baseline 'reader' role in public.user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, newsletter_subscribed)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'nombre',
      'UsuarioNuevo'
    ),
    NEW.raw_user_meta_data ->> 'avatar_url',
    FALSE
  );

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, 'reader')
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Drop legacy JWT role-sync trigger, auth hook, and legacy role helpers
DROP TRIGGER IF EXISTS on_user_role_changed ON public.users;
DROP FUNCTION IF EXISTS public.sync_user_role_to_auth();
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);
DROP FUNCTION IF EXISTS public.is_operator();
DROP FUNCTION IF EXISTS public.is_writer();
DROP FUNCTION IF EXISTS public.current_user_role();

-- 4. Clean up stale user_role metadata from auth.users
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data - 'user_role'
WHERE raw_app_meta_data ? 'user_role';

-- 5. Refresh anon column grants on public.users (excluding legacy role, keeping slug)
REVOKE SELECT ON TABLE public.users FROM anon;
GRANT SELECT (id, full_name, slug, bio, avatar_url) ON TABLE public.users TO anon;

-- 6. Drop legacy role column and enum type
ALTER TABLE public.users DROP COLUMN IF EXISTS role;
DROP TYPE IF EXISTS public.user_role;
