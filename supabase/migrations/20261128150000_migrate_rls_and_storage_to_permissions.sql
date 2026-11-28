-- ============================================================================
-- Migration: 20261128150000_migrate_rls_and_storage_to_permissions.sql
-- Description: Migrate all RLS policies across public tables and storage.objects
--   from legacy role helpers (is_operator, is_writer, current_user_role,
--   users.role / JWT app_metadata.user_role) to atomic public.has_permission().
--   Also adds enforce_publication_pin_permission trigger on public.publications.
-- ============================================================================

-- 1. Trigger: enforce_publication_pin_permission on public.publications
--    Alphabetical trigger naming ('e' < 's' < 'u') guarantees this runs BEFORE
--    set_publication_published_at_trigger and update_publications_updated_at,
--    comparing client-supplied column values before trigger-managed timestamps mutate.
CREATE OR REPLACE FUNCTION public.enforce_publication_pin_permission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role text := COALESCE(NULLIF(current_setting('role', true), 'none'), current_user);
  v_non_pin_changed boolean;
  v_can_edit_non_pin boolean;
BEGIN
  IF v_caller_role NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
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

  IF v_non_pin_changed THEN
    v_can_edit_non_pin := (
      public.has_permission('publications:update_any')
      OR (
        OLD.author_id = auth.uid()
        AND OLD.status <> 'published'::public.publication_status
        AND public.has_permission('publications:update_own')
        AND (
          NEW.status <> 'published'::public.publication_status
          OR public.has_permission('publications:publish')
        )
      )
      OR (
        OLD.author_id = auth.uid()
        AND OLD.status = 'published'::public.publication_status
        AND public.has_permission('publications:publish')
      )
      OR (
        OLD.status = 'in_review'::public.publication_status
        AND public.has_permission('publications:review')
      )
    );

    IF NOT v_can_edit_non_pin THEN
      RAISE EXCEPTION 'Insufficient privilege: cannot modify non-pin fields on this publication.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_publication_pin_permission() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_publication_pin_permission() TO service_role;

DROP TRIGGER IF EXISTS enforce_publication_pin_permission ON public.publications;
CREATE TRIGGER enforce_publication_pin_permission
  BEFORE INSERT OR UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_publication_pin_permission();

-- 2. RLS policies: public.publications
DROP POLICY IF EXISTS "Public read published publications" ON public.publications;
DROP POLICY IF EXISTS "Reviewers can view reviewable publications" ON public.publications;
CREATE POLICY "Public and authorized read publications"
  ON public.publications
  FOR SELECT
  USING (
    status = 'published'::public.publication_status
    OR auth.uid() = author_id
    OR (
      status = 'in_review'::public.publication_status
      AND public.has_permission('publications:review')
    )
    OR public.has_permission('publications:update_any')
    OR public.has_permission('publications:delete_any')
  );

DROP POLICY IF EXISTS "Authors can insert publications" ON public.publications;
CREATE POLICY "Authors can insert publications"
  ON public.publications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND public.has_permission('publications:create')
    AND (
      status <> 'published'::public.publication_status
      OR public.has_permission('publications:publish')
    )
    AND (
      is_pinned = false
      OR public.has_permission('publications:pin')
    )
  );

DROP POLICY IF EXISTS "Authors can update own publications" ON public.publications;
DROP POLICY IF EXISTS "Operators can update any publication" ON public.publications;
DROP POLICY IF EXISTS "Reviewers can update in_review publications" ON public.publications;

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
    AND (
      is_pinned = false
      OR public.has_permission('publications:pin')
    )
  );

CREATE POLICY "Publishers can update own published publications"
  ON public.publications
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id
    AND status = 'published'::public.publication_status
    AND public.has_permission('publications:publish')
  )
  WITH CHECK (
    auth.uid() = author_id
    AND public.has_permission('publications:publish')
  );

CREATE POLICY "Reviewers can update in_review publications"
  ON public.publications
  FOR UPDATE
  TO authenticated
  USING (
    status = 'in_review'::public.publication_status
    AND public.has_permission('publications:review')
  )
  WITH CHECK (
    public.has_permission('publications:review')
  );

CREATE POLICY "Editors can update any publication"
  ON public.publications
  FOR UPDATE
  TO authenticated
  USING (public.has_permission('publications:update_any'))
  WITH CHECK (public.has_permission('publications:update_any'));

CREATE POLICY "Pinners can pin published publications"
  ON public.publications
  FOR UPDATE
  TO authenticated
  USING (
    status = 'published'::public.publication_status
    AND public.has_permission('publications:pin')
  )
  WITH CHECK (
    status = 'published'::public.publication_status
    AND public.has_permission('publications:pin')
  );

DROP POLICY IF EXISTS "Authors and Admins can delete publications" ON public.publications;
CREATE POLICY "Authors and Admins can delete publications"
  ON public.publications
  FOR DELETE
  TO authenticated
  USING (
    public.has_permission('publications:delete_any')
    OR (
      auth.uid() = author_id
      AND status <> 'published'::public.publication_status
      AND public.has_permission('publications:delete_own')
    )
  );

-- 3. RLS policies: public.publication_tags
DROP POLICY IF EXISTS "Authors and Operators can insert publication tags" ON public.publication_tags;
CREATE POLICY "Authors and Operators can insert publication tags"
  ON public.publication_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_permission('publications:update_any')
    OR EXISTS (
      SELECT 1
      FROM public.publications p
      WHERE p.id = publication_tags.publication_id
        AND (
          (
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
    )
  );

DROP POLICY IF EXISTS "Authors and Operators can update publication tags" ON public.publication_tags;
CREATE POLICY "Authors and Operators can update publication tags"
  ON public.publication_tags
  FOR UPDATE
  TO authenticated
  USING (
    public.has_permission('publications:update_any')
    OR EXISTS (
      SELECT 1
      FROM public.publications p
      WHERE p.id = publication_tags.publication_id
        AND (
          (
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
    )
  )
  WITH CHECK (
    public.has_permission('publications:update_any')
    OR EXISTS (
      SELECT 1
      FROM public.publications p
      WHERE p.id = publication_tags.publication_id
        AND (
          (
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
    )
  );

DROP POLICY IF EXISTS "Authors and Operators can delete publication tags" ON public.publication_tags;
CREATE POLICY "Authors and Operators can delete publication tags"
  ON public.publication_tags
  FOR DELETE
  TO authenticated
  USING (
    public.has_permission('publications:update_any')
    OR EXISTS (
      SELECT 1
      FROM public.publications p
      WHERE p.id = publication_tags.publication_id
        AND (
          (
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
    )
  );

-- 4. RLS policies: public.tags & public.tag_translations
DROP POLICY IF EXISTS "Writers and Operators can insert tags" ON public.tags;
CREATE POLICY "Writers and Operators can insert tags"
  ON public.tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('tags:create'));

DROP POLICY IF EXISTS "Operators can update tags" ON public.tags;
CREATE POLICY "Operators can update tags"
  ON public.tags
  FOR UPDATE
  TO authenticated
  USING (public.has_permission('tags:update'))
  WITH CHECK (public.has_permission('tags:update'));

DROP POLICY IF EXISTS "Operators can delete tags" ON public.tags;
CREATE POLICY "Operators can delete tags"
  ON public.tags
  FOR DELETE
  TO authenticated
  USING (public.has_permission('tags:delete'));

DROP POLICY IF EXISTS "Writers and Operators can insert tag translations" ON public.tag_translations;
CREATE POLICY "Writers and Operators can insert tag translations"
  ON public.tag_translations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('tags:create'));

DROP POLICY IF EXISTS "Operators can update tag translations" ON public.tag_translations;
CREATE POLICY "Operators can update tag translations"
  ON public.tag_translations
  FOR UPDATE
  TO authenticated
  USING (public.has_permission('tags:update'))
  WITH CHECK (public.has_permission('tags:update'));

DROP POLICY IF EXISTS "Operators can delete tag translations" ON public.tag_translations;
CREATE POLICY "Operators can delete tag translations"
  ON public.tag_translations
  FOR DELETE
  TO authenticated
  USING (public.has_permission('tags:delete'));

-- 5. RLS policies: public.comments
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments"
  ON public.comments
  FOR SELECT
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
        )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1
      FROM public.publications p
      WHERE p.id = comments.publication_id
        AND p.status = 'published'::public.publication_status
    )
  );

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users and Operators can delete comments" ON public.comments;
CREATE POLICY "Users and Operators can delete comments"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR public.has_permission('comments:delete_any')
  );

-- 6. RLS policies: storage.objects (preserve exact policy names for seed.sql compatibility until Ticket 07)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Users can upload own profile" ON storage.objects;
CREATE POLICY "Users can upload own profile"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'users'
    AND (
      (storage.foldername(name))[2] = (auth.uid())::text
      OR public.has_permission('media:delete_any')
    )
  );

DROP POLICY IF EXISTS "Writers can upload publication images" ON storage.objects;
CREATE POLICY "Writers can upload publication images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'publications'
    AND EXISTS (
      SELECT 1
      FROM public.publications p
      WHERE p.id::text = (storage.foldername(name))[2]
        AND (
          (
            public.has_permission('media:upload_publication')
            AND p.author_id = auth.uid()
            AND (
              p.status <> 'published'::public.publication_status
              OR public.has_permission('publications:publish')
            )
          )
          OR public.has_permission('publications:update_any')
          OR (
            p.status = 'in_review'::public.publication_status
            AND public.has_permission('publications:review')
          )
        )
    )
  );

DROP POLICY IF EXISTS "Operators can upload orphan images" ON storage.objects;
CREATE POLICY "Operators can upload orphan images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = '_orphans'
    AND public.has_permission('media:delete_any')
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
        AND EXISTS (
          SELECT 1
          FROM public.publications p
          WHERE p.id::text = (storage.foldername(name))[2]
            AND (
              (
                public.has_permission('media:upload_publication')
                AND p.author_id = auth.uid()
                AND (
                  p.status <> 'published'::public.publication_status
                  OR public.has_permission('publications:publish')
                )
              )
              OR public.has_permission('publications:update_any')
              OR (
                p.status = 'in_review'::public.publication_status
                AND public.has_permission('publications:review')
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
        AND EXISTS (
          SELECT 1
          FROM public.publications p
          WHERE p.id::text = (storage.foldername(name))[2]
            AND (
              (
                public.has_permission('media:upload_publication')
                AND p.author_id = auth.uid()
                AND (
                  p.status <> 'published'::public.publication_status
                  OR public.has_permission('publications:publish')
                )
              )
              OR public.has_permission('publications:update_any')
              OR (
                p.status = 'in_review'::public.publication_status
                AND public.has_permission('publications:review')
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
        AND EXISTS (
          SELECT 1
          FROM public.publications p
          WHERE p.id::text = (storage.foldername(name))[2]
            AND (
              (
                public.has_permission('media:upload_publication')
                AND p.author_id = auth.uid()
                AND (
                  p.status <> 'published'::public.publication_status
                  OR public.has_permission('publications:publish')
                )
              )
              OR public.has_permission('publications:update_any')
              OR (
                p.status = 'in_review'::public.publication_status
                AND public.has_permission('publications:review')
              )
            )
        )
      )
    )
  );
