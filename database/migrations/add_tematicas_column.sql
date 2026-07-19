-- Ejecuta este script en el editor SQL de tu panel de Supabase
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS tematicas TEXT[] DEFAULT '{}';
