-- Migración para añadir el panel de artículos fijados y la tipología de textos

-- 1. Añadimos la columna 'fijado' (por defecto false)
ALTER TABLE public.articulos 
ADD COLUMN IF NOT EXISTS fijado BOOLEAN DEFAULT false;

-- 2. Añadimos la columna 'tipo' con los valores permitidos
ALTER TABLE public.articulos 
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'artigo' CHECK (tipo IN ('artigo', 'ensaio', 'reportaxe', 'columna', 'entrevista', 'poesía'));
