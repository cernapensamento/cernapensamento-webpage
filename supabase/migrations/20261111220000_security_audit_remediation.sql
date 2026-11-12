-- ============================================================================
-- Migration: 20261111220000_security_audit_remediation.sql
-- Description: Comprehensive hardening and remediation of security audit findings:
-- 1. Helper functions (current_user_role, is_operator, is_writer)
-- 2. Publication tags RLS (scoped author tagging, operator control, member injection fix)
-- 3. Tags & translations RLS (writers insert, operators update/delete)
-- 4. Publications RLS (scoped UPDATE/DELETE rules, operator management of published articles)
-- 5. Publication column privileges and check_publication_quotas hardening
-- 6. Storage objects RLS (delete/update restrictions for published article assets)
-- 7. Comments RLS (prevent comments on unpublished drafts, allow operator moderation)
-- 8. Auth security functions and triggers (handle_new_user search_path, hook privileges, role sync)
-- 9. Users column privileges (revoke newsletter_subscribed SELECT from anon)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper functions with strict search_path and execution privileges
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text,
    (SELECT (users.role)::text FROM public.users WHERE users.id = auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.current_user_role() = ANY (ARRAY['founder'::text, 'admin'::text]);
$$;

REVOKE ALL ON FUNCTION public.is_operator() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_operator() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_writer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.current_user_role() = ANY (ARRAY['guest'::text, 'member'::text, 'founder'::text, 'admin'::text]);
$$;

REVOKE ALL ON FUNCTION public.is_writer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_writer() TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 2. Publication tags RLS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Editors can manage publication tags" ON public.publication_tags;
DROP POLICY IF EXISTS "Authors and Operators can insert publication tags" ON public.publication_tags;
DROP POLICY IF EXISTS "Authors and Operators can update publication tags" ON public.publication_tags;
DROP POLICY IF EXISTS "Authors and Operators can delete publication tags" ON public.publication_tags;

CREATE POLICY "Authors and Operators can insert publication tags" ON public.publication_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_operator()
    OR (
      public.is_writer()
      AND EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.id = publication_tags.publication_id
          AND p.author_id = auth.uid()
          AND p.status <> 'published'::public.publication_status
      )
    )
  );

CREATE POLICY "Authors and Operators can update publication tags" ON public.publication_tags
  FOR UPDATE TO authenticated
  USING (
    public.is_operator()
    OR (
      public.is_writer()
      AND EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.id = publication_tags.publication_id
          AND p.author_id = auth.uid()
          AND p.status <> 'published'::public.publication_status
      )
    )
  )
  WITH CHECK (
    public.is_operator()
    OR (
      public.is_writer()
      AND EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.id = publication_tags.publication_id
          AND p.author_id = auth.uid()
          AND p.status <> 'published'::public.publication_status
      )
    )
  );

CREATE POLICY "Authors and Operators can delete publication tags" ON public.publication_tags
  FOR DELETE TO authenticated
  USING (
    public.is_operator()
    OR (
      public.is_writer()
      AND EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.id = publication_tags.publication_id
          AND p.author_id = auth.uid()
          AND p.status <> 'published'::public.publication_status
      )
    )
  );


-- ----------------------------------------------------------------------------
-- 3. Tags and Tag Translations RLS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Editors can manage tags" ON public.tags;
DROP POLICY IF EXISTS "Writers and Operators can insert tags" ON public.tags;
DROP POLICY IF EXISTS "Operators can update tags" ON public.tags;
DROP POLICY IF EXISTS "Operators can delete tags" ON public.tags;

CREATE POLICY "Writers and Operators can insert tags" ON public.tags
  FOR INSERT TO authenticated
  WITH CHECK (public.is_writer());

CREATE POLICY "Operators can update tags" ON public.tags
  FOR UPDATE TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

CREATE POLICY "Operators can delete tags" ON public.tags
  FOR DELETE TO authenticated
  USING (public.is_operator());

DROP POLICY IF EXISTS "Editors can manage tag translations" ON public.tag_translations;
DROP POLICY IF EXISTS "Writers and Operators can insert tag translations" ON public.tag_translations;
DROP POLICY IF EXISTS "Operators can update tag translations" ON public.tag_translations;
DROP POLICY IF EXISTS "Operators can delete tag translations" ON public.tag_translations;

CREATE POLICY "Writers and Operators can insert tag translations" ON public.tag_translations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_writer());

CREATE POLICY "Operators can update tag translations" ON public.tag_translations
  FOR UPDATE TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

CREATE POLICY "Operators can delete tag translations" ON public.tag_translations
  FOR DELETE TO authenticated
  USING (public.is_operator());


-- ----------------------------------------------------------------------------
-- 4. Publications RLS (UPDATE & DELETE rules)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authors can insert publications" ON public.publications;
CREATE POLICY "Authors can insert publications" ON public.publications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND public.is_writer()
    AND (
      public.is_operator()
      OR (status <> 'published'::public.publication_status AND is_pinned = false)
    )
  );

DROP POLICY IF EXISTS "Authors can update own publications" ON public.publications;
CREATE POLICY "Authors can update own publications" ON public.publications
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = author_id
    AND (public.is_operator() OR status <> 'published'::public.publication_status)
  )
  WITH CHECK (
    auth.uid() = author_id
    AND (
      public.is_operator()
      OR (status <> 'published'::public.publication_status AND is_pinned = false)
    )
  );

DROP POLICY IF EXISTS "Operators can update any publication" ON public.publications;
CREATE POLICY "Operators can update any publication" ON public.publications
  FOR UPDATE TO authenticated
  USING (public.is_operator())
  WITH CHECK (public.is_operator());

DROP POLICY IF EXISTS "Authors and Admins can delete publications" ON public.publications;
CREATE POLICY "Authors and Admins can delete publications" ON public.publications
  FOR DELETE TO authenticated
  USING (
    public.is_operator()
    OR (
      auth.uid() = author_id
      AND status <> 'published'::public.publication_status
      AND public.is_writer()
    )
  );


-- ----------------------------------------------------------------------------
-- 5. Publication Column Privileges & Quota Trigger Hardening
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_publication_quotas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role public.user_role;
  v_total_count int;
  v_year_count int;
BEGIN
  -- Always enforce server-authoritative timestamps on publication creation
  NEW.created_at := timezone('utc'::text, now());
  NEW.updated_at := timezone('utc'::text, now());

  SELECT role INTO v_role FROM public.users WHERE id = NEW.author_id;

  IF v_role = 'guest' THEN
    SELECT count(*) INTO v_total_count FROM public.publications WHERE author_id = NEW.author_id;
    IF v_total_count >= 4 THEN
      RAISE EXCEPTION 'Límite total alcanzado: Un autor invitado no puede crear más de 4 publicaciones en total.';
    END IF;

    SELECT count(*) INTO v_year_count FROM public.publications
    WHERE author_id = NEW.author_id
      AND extract(year from created_at) = extract(year from NEW.created_at);
    IF v_year_count >= 2 THEN
      RAISE EXCEPTION 'Límite anual alcanzado: Un autor invitado no puede crear más de 2 publicaciones este año.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON TABLE public.publications FROM anon, authenticated;
GRANT SELECT ON TABLE public.publications TO anon, authenticated;
GRANT INSERT (
  id,
  slug,
  title,
  subtitle,
  content,
  cover_image_url,
  status,
  type,
  original_language,
  is_pinned,
  published_at,
  author_id,
  updated_at
) ON TABLE public.publications TO authenticated;
GRANT UPDATE (
  slug,
  title,
  subtitle,
  content,
  cover_image_url,
  status,
  type,
  original_language,
  is_pinned,
  published_at,
  updated_at
) ON TABLE public.publications TO authenticated;
GRANT DELETE ON TABLE public.publications TO authenticated;
GRANT ALL ON TABLE public.publications TO service_role;


-- ----------------------------------------------------------------------------
-- 6. Storage Objects RLS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users or admins can delete images" ON storage.objects;
CREATE POLICY "Users or admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('media', 'imagenes-articulos')
  AND (
    -- Own profile avatar
    ((storage.foldername(name))[1] = 'profiles' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR
    ((storage.foldername(name))[1] = 'avatares' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR
    -- Founders and Admins can delete any image
    public.is_operator()
    OR
    -- Writers can delete their own publication images ONLY IF they are NOT in a published article
    (
      (
        ((storage.foldername(name))[1] = 'publications' AND (storage.foldername(name))[3] = (auth.uid())::text)
        OR
        ((storage.foldername(name))[1] IN ('portadas', 'contenido') AND (storage.foldername(name))[2] = (auth.uid())::text)
      )
      AND public.is_writer()
      AND NOT EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.author_id = auth.uid()
          AND p.status = 'published'::public.publication_status
          AND (
            p.cover_image_url LIKE '%' || storage.objects.name || '%'
            OR p.content::text LIKE '%' || storage.objects.name || '%'
          )
      )
    )
  )
);

DROP POLICY IF EXISTS "Users or admins can update images" ON storage.objects;
CREATE POLICY "Users or admins can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('media', 'imagenes-articulos')
  AND (
    -- Own profile avatar
    ((storage.foldername(name))[1] = 'profiles' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR
    ((storage.foldername(name))[1] = 'avatares' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR
    -- Founders and Admins can update any image
    public.is_operator()
    OR
    -- Writers can update their own publication images ONLY IF they are NOT in a published article
    (
      (
        ((storage.foldername(name))[1] = 'publications' AND (storage.foldername(name))[3] = (auth.uid())::text)
        OR
        ((storage.foldername(name))[1] IN ('portadas', 'contenido') AND (storage.foldername(name))[2] = (auth.uid())::text)
      )
      AND public.is_writer()
      AND NOT EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.author_id = auth.uid()
          AND p.status = 'published'::public.publication_status
          AND (
            p.cover_image_url LIKE '%' || storage.objects.name || '%'
            OR p.content::text LIKE '%' || storage.objects.name || '%'
          )
      )
    )
  )
);


-- ----------------------------------------------------------------------------
-- 7. Comments RLS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.publications p
      WHERE p.id = comments.publication_id
        AND (
          p.status = 'published'::public.publication_status
          OR p.author_id = auth.uid()
          OR public.is_operator()
        )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.publications p
      WHERE p.id = comments.publication_id
        AND p.status = 'published'::public.publication_status
    )
  );

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users and Operators can delete comments" ON public.comments;
CREATE POLICY "Users and Operators can delete comments" ON public.comments
  FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR public.is_operator()
  );


-- ----------------------------------------------------------------------------
-- 8. Auth Security Functions and Triggers
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  v_user_role public.user_role;
BEGIN
  -- Fetch user role directly from public.users
  SELECT role INTO v_user_role FROM public.users WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF v_user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata, user_role}', to_jsonb(v_user_role::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_user_role::text));
  ELSE
    claims := jsonb_set(claims, '{app_metadata, user_role}', '"reader"'::jsonb);
    claims := jsonb_set(claims, '{user_role}', '"reader"'::jsonb);
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role, supabase_auth_admin;

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
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{user_role}',
    to_jsonb(NEW.role::text)
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_user_role_to_auth() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_user_role_to_auth() TO service_role;

DROP TRIGGER IF EXISTS on_user_role_changed ON public.users;
CREATE TRIGGER on_user_role_changed
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_auth();


-- ----------------------------------------------------------------------------
-- 9. Users Column Privileges
-- ----------------------------------------------------------------------------

REVOKE SELECT ON TABLE public.users FROM anon;
GRANT SELECT (id, full_name, slug, bio, avatar_url, role) ON TABLE public.users TO anon;
