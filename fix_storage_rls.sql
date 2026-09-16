-- Allow users to insert their own avatars
CREATE POLICY "Permitir insertar avatares" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'imagenes-articulos' AND 
  (storage.foldername(name))[1] = 'avatares' AND 
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to update their own avatars
CREATE POLICY "Permitir actualizar avatares" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'imagenes-articulos' AND 
  (storage.foldername(name))[1] = 'avatares' AND 
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own avatars
CREATE POLICY "Permitir borrar avatares" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'imagenes-articulos' AND 
  (storage.foldername(name))[1] = 'avatares' AND 
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Ensure public read access to avatares (if not already covered by a global read policy)
CREATE POLICY "Permitir leer avatares" ON storage.objects FOR SELECT USING (
  bucket_id = 'imagenes-articulos' AND 
  (storage.foldername(name))[1] = 'avatares'
);
