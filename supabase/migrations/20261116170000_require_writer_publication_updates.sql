-- Require public.is_writer() on author publication updates so demoted readers
-- cannot modify previously created unpublished drafts.
DROP POLICY IF EXISTS "Authors can update own publications" ON public.publications;
CREATE POLICY "Authors can update own publications" ON public.publications
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = author_id
    AND public.is_writer()
    AND (public.is_operator() OR status <> 'published'::public.publication_status)
  )
  WITH CHECK (
    auth.uid() = author_id
    AND public.is_writer()
    AND (
      public.is_operator()
      OR (status <> 'published'::public.publication_status AND is_pinned = false)
    )
  );
