    -- 1. Crear el bucket 'imagenes-articulos' y configurarlo como público
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('imagenes-articulos', 'imagenes-articulos', true)
    ON CONFLICT (id) DO NOTHING;
  
    -- ==========================================
    -- POLÍTICAS PARA LOS ARCHIVOS (storage.objects)
    -- ==========================================
  
    -- 2. Cualquiera puede ver las imágenes (esencial para que se vean en el frontend)      
    CREATE POLICY "Imágenes públicas para lectura"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'imagenes-articulos');
  
    -- 3. Solo usuarios autenticados pueden subir nuevas imágenes
    CREATE POLICY "Usuarios autenticados pueden subir imágenes"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'imagenes-articulos' 
        AND auth.role() = 'authenticated'
      );
  
    -- 4. Un usuario solo puede modificar o actualizar las imágenes que él mismo subió      
    CREATE POLICY "Usuarios pueden actualizar sus propias imágenes"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'imagenes-articulos' 
        AND auth.uid() = owner
      );
  
    -- 5. Un usuario solo puede borrar las imágenes que él mismo subió
    CREATE POLICY "Usuarios pueden borrar sus propias imágenes"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'imagenes-articulos' 
        AND auth.uid() = owner
      );
