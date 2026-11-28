-- ============================================================================
-- Migration: 20261128170000_rbac_review_fixes.sql
-- Description:
--   1. Extract public.can_edit_publication(uuid) to consolidate publication edit
--      authorization across publication_tags, storage.objects, and triggers.
--   2. Replace enforce_publication_pin_permission() with
--      enforce_publication_mutation_guards() to also enforce publications:publish
--      (or publications:review on in_review) when transitioning to 'published'.
--   3. Simplify publication_tags and storage.objects policies to call
--      public.can_edit_publication(...) while preserving exact policy names.
-- ============================================================================

-- 1. Shared publication edit eligibility helper
CREATE OR REPLACE FUNCTION public.can_edit_publication(p_publication_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.publications p
    WHERE p.id = p_publication_id
      AND (
        public.has_permission('publications:update_any')
        OR (
          p.author_id = auth.uid()
          AND p.status <> 'published'::public.publication_status
          AND public.has_permission('publications:update_own')
        )
        OR (
          p.author_id = auth.uid()
          AND p.status = 'published'::public.publication_status
          AND public.has_permission('publications:publish')
        )
        OR (
          p.status = 'in_review'::public.publication_status
          AND public.has_permission('publications:review')
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_edit_publication(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_edit_publication(uuid) TO authenticated, anon, service_role;

-- 2. Trigger: enforce_publication_mutation_guards on public.publications
--    Alphabetical trigger naming ('e' < 's' < 'u') guarantees this runs BEFORE
--    set_publication_published_at_trigger and update_publications_updated_at,
--    comparing client-supplied column values before trigger-managed timestamps mutate.
CREATE OR REPLACE FUNCTION public.enforce_publication_mutation_guards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role text := COALESCE(NULLIF(current_setting('role', true), 'none'), current_user);
  v_non_pin_changed boolean;
BEGIN
  IF v_caller_role NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- Guard transitions into 'published': bare publications:update_any cannot publish drafts.
  IF NEW.status = 'published'::public.publication_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published'::public.publication_status) THEN
    IF NOT (
      public.has_permission('publications:publish')
      OR (
        TG_OP = 'UPDATE'
        AND OLD.status = 'in_review'::public.publication_status
        AND public.has_permission('publications:review')
      )
    ) THEN
      RAISE EXCEPTION 'Insufficient privilege: publications:publish permission is required to publish a publication.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.is_pinned IS TRUE AND NOT public.has_permission('publications:pin') THEN
      RAISE EXCEPTION 'Insufficient privilege: publications:pin permission is required to pin a publication.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- TG_OP = 'UPDATE'
  IF NEW.is_pinned IS DISTINCT FROM OLD.is_pinned AND NOT public.has_permission('publications:pin') THEN
    RAISE EXCEPTION 'Insufficient privilege: publications:pin permission is required to change is_pinned.'
      USING ERRCODE = '42501';
  END IF;

  v_non_pin_changed := (
    NEW.id IS DISTINCT FROM OLD.id
    OR NEW.slug IS DISTINCT FROM OLD.slug
    OR NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.updated_at IS DISTINCT FROM OLD.updated_at
    OR NEW.author_id IS DISTINCT FROM OLD.author_id
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.original_language IS DISTINCT FROM OLD.original_language
    OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.subtitle IS DISTINCT FROM OLD.subtitle
    OR NEW.content IS DISTINCT FROM OLD.content
    OR NEW.newsletter_sent_at IS DISTINCT FROM OLD.newsletter_sent_at
    OR NEW.published_at IS DISTINCT FROM OLD.published_at
    OR NEW.show_index IS DISTINCT FROM OLD.show_index
  );

  IF v_non_pin_changed AND NOT public.can_edit_publication(OLD.id) THEN
    RAISE EXCEPTION 'Insufficient privilege: cannot modify non-pin fields on this publication.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_publication_mutation_guards() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_publication_mutation_guards() TO service_role;

DROP TRIGGER IF EXISTS enforce_publication_pin_permission ON public.publications;
DROP FUNCTION IF EXISTS public.enforce_publication_pin_permission();

DROP TRIGGER IF EXISTS enforce_publication_mutation_guards ON public.publications;
CREATE TRIGGER enforce_publication_mutation_guards
  BEFORE INSERT OR UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_publication_mutation_guards();

-- 3. Consolidate public.publication_tags RLS policies to use public.can_edit_publication()
DROP POLICY IF EXISTS "Authors and Operators can insert publication tags" ON public.publication_tags;
CREATE POLICY "Authors and Operators can insert publication tags"
  ON public.publication_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_edit_publication(publication_tags.publication_id));

DROP POLICY IF EXISTS "Authors and Operators can update publication tags" ON public.publication_tags;
CREATE POLICY "Authors and Operators can update publication tags"
  ON public.publication_tags
  FOR UPDATE
  TO authenticated
  USING (public.can_edit_publication(publication_tags.publication_id))
  WITH CHECK (public.can_edit_publication(publication_tags.publication_id));

DROP POLICY IF EXISTS "Authors and Operators can delete publication tags" ON public.publication_tags;
CREATE POLICY "Authors and Operators can delete publication tags"
  ON public.publication_tags
  FOR DELETE
  TO authenticated
  USING (public.can_edit_publication(publication_tags.publication_id));

-- 4. Consolidate storage.objects publication policies to use public.can_edit_publication()
DROP POLICY IF EXISTS "Writers can upload publication images" ON storage.objects;
CREATE POLICY "Writers can upload publication images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'publications'
    AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    AND (
      public.can_edit_publication(((storage.foldername(name))[2])::uuid)
      OR (
        public.has_permission('media:upload_publication')
        AND EXISTS (
          SELECT 1
          FROM public.publications p
          WHERE p.id = ((storage.foldername(name))[2])::uuid
            AND p.author_id = auth.uid()
            AND p.status <> 'published'::public.publication_status
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users or admins can delete images" ON storage.objects;
CREATE POLICY "Users or admins can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (
      public.has_permission('media:delete_any')
      OR (
        (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = (auth.uid())::text
      )
      OR (
        (storage.foldername(name))[1] = 'publications'
        AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        AND (
          public.can_edit_publication(((storage.foldername(name))[2])::uuid)
          OR (
            public.has_permission('media:upload_publication')
            AND EXISTS (
              SELECT 1
              FROM public.publications p
              WHERE p.id = ((storage.foldername(name))[2])::uuid
                AND p.author_id = auth.uid()
                AND p.status <> 'published'::public.publication_status
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users or admins can update images" ON storage.objects;
CREATE POLICY "Users or admins can update images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (
      public.has_permission('media:delete_any')
      OR (
        (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = (auth.uid())::text
      )
      OR (
        (storage.foldername(name))[1] = 'publications'
        AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        AND (
          public.can_edit_publication(((storage.foldername(name))[2])::uuid)
          OR (
            public.has_permission('media:upload_publication')
            AND EXISTS (
              SELECT 1
              FROM public.publications p
              WHERE p.id = ((storage.foldername(name))[2])::uuid
                AND p.author_id = auth.uid()
                AND p.status <> 'published'::public.publication_status
            )
          )
        )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'media'
    AND (
      public.has_permission('media:delete_any')
      OR (
        (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = (auth.uid())::text
      )
      OR (
        (storage.foldername(name))[1] = 'publications'
        AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        AND (
          public.can_edit_publication(((storage.foldername(name))[2])::uuid)
          OR (
            public.has_permission('media:upload_publication')
            AND EXISTS (
              SELECT 1
              FROM public.publications p
              WHERE p.id = ((storage.foldername(name))[2])::uuid
                AND p.author_id = auth.uid()
                AND p.status <> 'published'::public.publication_status
            )
          )
        )
      )
    )
  );


-- 5. Allow authors to edit non-pin fields on an already-pinned unpublished publication
--    (enforce_publication_mutation_guards() already blocks unauthorized is_pinned changes)
DROP POLICY IF EXISTS "Authors can update own unpublished publications" ON public.publications;
CREATE POLICY "Authors can update own unpublished publications"
  ON public.publications
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id
    AND status <> 'published'::public.publication_status
    AND public.has_permission('publications:update_own')
  )
  WITH CHECK (
    auth.uid() = author_id
    AND public.has_permission('publications:update_own')
    AND (
      status <> 'published'::public.publication_status
      OR public.has_permission('publications:publish')
    )
  );

-- 6. Make prevent_removing_last_admin() safe under REPEATABLE READ via FOR UPDATE locking read
CREATE OR REPLACE FUNCTION public.prevent_removing_last_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_remaining_admins integer;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role_id = 'admin')
     OR (TG_OP = 'UPDATE' AND OLD.role_id = 'admin' AND NEW.role_id <> 'admin') THEN
    PERFORM pg_advisory_xact_lock(hashtext('public.user_roles:last_admin'));

    PERFORM 1
    FROM public.user_roles
    WHERE role_id = 'admin'
      AND user_id <> OLD.user_id
    FOR UPDATE;
    GET DIAGNOSTICS v_remaining_admins = ROW_COUNT;

    IF v_remaining_admins = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last remaining admin role assignment.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Allow moderators holding comments:delete_any to read comments on any publication
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments"
  ON public.comments
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.publications p
      WHERE p.id = comments.publication_id
        AND (
          p.status = 'published'::public.publication_status
          OR p.author_id = auth.uid()
          OR (
            p.status = 'in_review'::public.publication_status
            AND public.has_permission('publications:review')
          )
          OR public.has_permission('publications:update_any')
          OR public.has_permission('publications:delete_any')
          OR public.has_permission('comments:delete_any')
        )
    )
  );
