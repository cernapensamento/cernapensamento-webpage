-- ============================================================================
-- Migration: 20261128120000_contract_storage_webp_only.sql
-- Description: Contract phase for unified WebP-only `media` storage.
--   - Locks `media` bucket to `allowed_mime_types = ARRAY['image/webp']`
--     (keeping `public = true`, `file_size_limit = 5242880`).
--   - Deletes legacy `imagenes-articulos` bucket if it still exists (no-op
--     when already deleted in production).
--   - Replaces `storage.objects` RLS policies so ONLY `bucket_id = 'media'`
--     and ONLY canonical entity-grouped folders (`users/{userId}/*`,
--     `publications/{publicationId}/*`, operator-only `_orphans/*`) are
--     permitted, removing all legacy bucket and legacy folder branches.
-- ============================================================================

-- 1. Lock `media` bucket to WebP-only (5 MiB limit, public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 5242880, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp'];

-- 2. Legacy `imagenes-articulos` bucket removal:
--    Supabase enforces `storage.protect_delete`, so buckets/objects must be deleted
--    via the Storage API (`scripts/migrate-storage.ts cleanup`, completed in Ticket 06).
--    The contracted RLS policies below restrict all `storage.objects` access to `media`.

-- 3. Public read access restricted to `media` bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- 4. Profile avatar uploads: `users/{userId}/*` on `media`
DROP POLICY IF EXISTS "Users can upload own profile" ON storage.objects;
CREATE POLICY "Users can upload own profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'users'
  AND (
    (storage.foldername(name))[2] = (auth.uid())::text
    OR public.is_operator()
  )
);

-- 5. Publication image uploads: `publications/{publicationId}/*` on `media`
DROP POLICY IF EXISTS "Writers can upload publication images" ON storage.objects;
CREATE POLICY "Writers can upload publication images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  public.is_writer()
  AND bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'publications'
  AND EXISTS (
    SELECT 1 FROM public.publications p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.author_id = auth.uid() OR public.is_operator())
  )
);

-- 6. Orphan quarantine uploads: `_orphans/*` strictly for operators (service_role bypasses RLS)
DROP POLICY IF EXISTS "Operators can upload orphan images" ON storage.objects;
CREATE POLICY "Operators can upload orphan images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = '_orphans'
  AND public.is_operator()
);

-- 7. Scoped Delete Policy (canonical entity-grouped + operator override)
DROP POLICY IF EXISTS "Users or admins can delete images" ON storage.objects;
CREATE POLICY "Users or admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND (
    public.is_operator()
    OR (
      (storage.foldername(name))[1] = 'users'
      AND (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR (
      (storage.foldername(name))[1] = 'publications'
      AND public.is_writer()
      AND EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.author_id = auth.uid()
          AND p.status <> 'published'::public.publication_status
      )
    )
  )
);

-- 8. Scoped Update Policy (canonical entity-grouped + operator override)
DROP POLICY IF EXISTS "Users or admins can update images" ON storage.objects;
CREATE POLICY "Users or admins can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND (
    public.is_operator()
    OR (
      (storage.foldername(name))[1] = 'users'
      AND (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR (
      (storage.foldername(name))[1] = 'publications'
      AND public.is_writer()
      AND EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.author_id = auth.uid()
          AND p.status <> 'published'::public.publication_status
      )
    )
  )
);
