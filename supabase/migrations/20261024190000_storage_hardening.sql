-- ============================================================================
-- Migration: 20261024190000_storage_hardening.sql
-- Description: Hardens Supabase Storage bucket configuration and establishes
--              canonical English bucket 'media' and granular RLS policies.
-- ============================================================================

-- 1. Configure the primary canonical 'media' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  5242880, -- 5 MB ceiling post client-side compression
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- 1b. Ensure legacy 'imagenes-articulos' bucket exists for backwards-compatibility
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imagenes-articulos',
  'imagenes-articulos',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- 2. Drop existing rudimentary storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile" ON storage.objects;
DROP POLICY IF EXISTS "Writers can upload publication images" ON storage.objects;
DROP POLICY IF EXISTS "Users or admins can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Users or admins can update images" ON storage.objects;

-- 3. Public Read Access Policy
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('media', 'imagenes-articulos'));

-- 4. Scoped Profile Avatar Upload Policy (Any authenticated user for their own avatar)
CREATE POLICY "Users can upload own profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('media', 'imagenes-articulos')
  AND (
    -- Canonical: profiles/{userId}/...
    ((storage.foldername(name))[1] = 'profiles' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR
    -- Legacy: avatares/{userId}/...
    ((storage.foldername(name))[1] = 'avatares' AND (storage.foldername(name))[2] = (auth.uid())::text)
  )
);

-- 5. Scoped Publication Images Upload Policy (Writers only)
CREATE POLICY "Writers can upload publication images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('media', 'imagenes-articulos')
  AND (
    -- Canonical: publications/covers/{userId}/... or publications/inline/{userId}/...
    (
      (storage.foldername(name))[1] = 'publications'
      AND (storage.foldername(name))[2] IN ('covers', 'inline')
      AND (storage.foldername(name))[3] = (auth.uid())::text
    )
    OR
    -- Legacy: portadas/{userId}/... or contenido/{userId}/...
    (
      (storage.foldername(name))[1] IN ('portadas', 'contenido')
      AND (storage.foldername(name))[2] = (auth.uid())::text
    )
  )
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('guest', 'member', 'founder', 'admin')
  )
);

-- 6. Scoped Delete Policy (Own folder or founder/admin)
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
    -- Own publication images
    ((storage.foldername(name))[1] = 'publications' AND (storage.foldername(name))[3] = (auth.uid())::text)
    OR
    ((storage.foldername(name))[1] IN ('portadas', 'contenido') AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR
    -- Founders and Admins can delete any image
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('founder', 'admin')
    )
  )
);

-- 7. Scoped Update Policy (Overwrite protection)
CREATE POLICY "Users or admins can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('media', 'imagenes-articulos')
  AND (
    ((storage.foldername(name))[1] = 'profiles' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR
    ((storage.foldername(name))[1] = 'avatares' AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR
    ((storage.foldername(name))[1] = 'publications' AND (storage.foldername(name))[3] = (auth.uid())::text)
    OR
    ((storage.foldername(name))[1] IN ('portadas', 'contenido') AND (storage.foldername(name))[2] = (auth.uid())::text)
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('founder', 'admin')
    )
  )
);
