-- ============================================================================
-- Migration: 20261124120000_expand_storage_rls_entity_paths.sql
-- Description: Expand phase for unified entity-grouped `media` storage layout.
--   - Adds Storage RLS support on `media` for:
--       * users/{userId}/* (owning user or Editorial Board operators)
--       * publications/{publicationId}/* (owning writer or operators;
--         UPDATE/DELETE blocked for non-operators when publication is published)
--       * _orphans/* (strictly operators and service_role)
--   - Keeps all legacy bucket (`imagenes-articulos`) and legacy folder
--     (`profiles/*`, `avatares/*`, `publications/covers/*`,
--      `publications/inline/*`, `portadas/*`, `contenido/*`) policies active
--     until the contract phase after migration.
-- ============================================================================

-- 1. Profile avatar uploads: users/{userId}/* (new) + profiles/* / avatares/* (legacy)
DROP POLICY IF EXISTS "Users can upload own profile" ON storage.objects;
CREATE POLICY "Users can upload own profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  (
    -- New entity-grouped layout on `media`: users/{userId}/*
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'users'
    AND (
      (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_operator()
    )
  )
  OR (
    -- Legacy layouts during expand phase
    bucket_id IN ('media', 'imagenes-articulos')
    AND (storage.foldername(name))[1] IN ('profiles', 'avatares')
    AND (storage.foldername(name))[2] = (auth.uid())::text
  )
);

-- 2. Publication image uploads: publications/{publicationId}/* (new) + legacy uploader-scoped folders
DROP POLICY IF EXISTS "Writers can upload publication images" ON storage.objects;
CREATE POLICY "Writers can upload publication images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  public.is_writer()
  AND (
    (
      -- New entity-grouped layout on `media`: publications/{publicationId}/*
      bucket_id = 'media'
      AND (storage.foldername(name))[1] = 'publications'
      AND (storage.foldername(name))[2] NOT IN ('covers', 'inline')
      AND EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND (p.author_id = auth.uid() OR public.is_operator())
      )
    )
    OR (
      -- Legacy layouts during expand phase
      bucket_id IN ('media', 'imagenes-articulos')
      AND (
        (
          (storage.foldername(name))[1] = 'publications'
          AND (storage.foldername(name))[2] IN ('covers', 'inline')
          AND (storage.foldername(name))[3] = (auth.uid())::text
        )
        OR (
          (storage.foldername(name))[1] IN ('portadas', 'contenido')
          AND (storage.foldername(name))[2] = (auth.uid())::text
        )
      )
    )
  )
);

-- 3. Orphan quarantine uploads: _orphans/* strictly for operators (service_role bypasses RLS)
DROP POLICY IF EXISTS "Operators can upload orphan images" ON storage.objects;
CREATE POLICY "Operators can upload orphan images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = '_orphans'
  AND public.is_operator()
);

-- 4. Scoped Delete Policy (entity-grouped + legacy + operator override)
DROP POLICY IF EXISTS "Users or admins can delete images" ON storage.objects;
CREATE POLICY "Users or admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('media', 'imagenes-articulos')
  AND (
    -- Founders and Admins can delete any image (including users/*, publications/*, _orphans/*, legacy)
    public.is_operator()
    OR (
      -- New entity-grouped user avatar: users/{userId}/*
      bucket_id = 'media'
      AND (storage.foldername(name))[1] = 'users'
      AND (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR (
      -- Legacy user avatar: profiles/{userId}/* or avatares/{userId}/*
      (storage.foldername(name))[1] IN ('profiles', 'avatares')
      AND (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR (
      -- New entity-grouped publication assets: publications/{publicationId}/*
      -- Allowed for owning writer only when publication is NOT published
      bucket_id = 'media'
      AND (storage.foldername(name))[1] = 'publications'
      AND (storage.foldername(name))[2] NOT IN ('covers', 'inline')
      AND public.is_writer()
      AND EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.author_id = auth.uid()
          AND p.status <> 'published'::public.publication_status
      )
    )
    OR (
      -- Legacy publication assets: allowed for owning writer only when NOT in a published article
      (
        ((storage.foldername(name))[1] = 'publications' AND (storage.foldername(name))[2] IN ('covers', 'inline') AND (storage.foldername(name))[3] = (auth.uid())::text)
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

-- 5. Scoped Update Policy (entity-grouped + legacy + operator override)
DROP POLICY IF EXISTS "Users or admins can update images" ON storage.objects;
CREATE POLICY "Users or admins can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('media', 'imagenes-articulos')
  AND (
    -- Founders and Admins can update any image (including users/*, publications/*, _orphans/*, legacy)
    public.is_operator()
    OR (
      -- New entity-grouped user avatar: users/{userId}/*
      bucket_id = 'media'
      AND (storage.foldername(name))[1] = 'users'
      AND (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR (
      -- Legacy user avatar: profiles/{userId}/* or avatares/{userId}/*
      (storage.foldername(name))[1] IN ('profiles', 'avatares')
      AND (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR (
      -- New entity-grouped publication assets: publications/{publicationId}/*
      -- Allowed for owning writer only when publication is NOT published
      bucket_id = 'media'
      AND (storage.foldername(name))[1] = 'publications'
      AND (storage.foldername(name))[2] NOT IN ('covers', 'inline')
      AND public.is_writer()
      AND EXISTS (
        SELECT 1 FROM public.publications p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.author_id = auth.uid()
          AND p.status <> 'published'::public.publication_status
      )
    )
    OR (
      -- Legacy publication assets: allowed for owning writer only when NOT in a published article
      (
        ((storage.foldername(name))[1] = 'publications' AND (storage.foldername(name))[2] IN ('covers', 'inline') AND (storage.foldername(name))[3] = (auth.uid())::text)
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
