-- Ejecuta este script en el editor SQL de tu panel de Supabase
-- Esto asegura que los escritores tengan permisos a nivel de base de datos para borrar sus propios artículos.

CREATE POLICY "Permitir a los usuarios eliminar sus propios articulos"
ON articulos
FOR DELETE
USING (auth.uid() = autor_id);
