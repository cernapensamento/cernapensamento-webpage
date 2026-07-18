-- 1. Añadir las nuevas columnas permitiendo nulos temporalmente
ALTER TABLE public.articulos 
ADD COLUMN IF NOT EXISTS idioma_original TEXT DEFAULT 'gl' CHECK (idioma_original IN ('gl', 'es')),
ADD COLUMN IF NOT EXISTS titulo_gl TEXT,
ADD COLUMN IF NOT EXISTS titulo_es TEXT,
ADD COLUMN IF NOT EXISTS subtitulo_gl TEXT,
ADD COLUMN IF NOT EXISTS subtitulo_es TEXT,
ADD COLUMN IF NOT EXISTS contenido_gl TEXT,
ADD COLUMN IF NOT EXISTS contenido_es TEXT;

-- 2. Copiar los datos de las columnas antiguas a las nuevas (asumimos que lo escrito originalmente estaba en gallego, pero rellenamos ambas para que no falle la web en castellano mientras no se traduzca).
UPDATE public.articulos
SET 
  idioma_original = 'gl',
  titulo_gl = titulo,
  titulo_es = titulo,
  subtitulo_gl = subtitulo,
  subtitulo_es = subtitulo,
  contenido_gl = contenido,
  contenido_es = contenido
WHERE titulo_gl IS NULL;

-- 3. Restringir que los campos no sean nulos (excepto los subtítulos)
ALTER TABLE public.articulos ALTER COLUMN titulo_gl SET NOT NULL;
ALTER TABLE public.articulos ALTER COLUMN titulo_es SET NOT NULL;
ALTER TABLE public.articulos ALTER COLUMN contenido_gl SET NOT NULL;
ALTER TABLE public.articulos ALTER COLUMN contenido_es SET NOT NULL;

-- 4. Borrar las columnas antiguas para dejar la tabla limpia
ALTER TABLE public.articulos DROP COLUMN IF EXISTS titulo;
ALTER TABLE public.articulos DROP COLUMN IF EXISTS subtitulo;
ALTER TABLE public.articulos DROP COLUMN IF EXISTS contenido;
