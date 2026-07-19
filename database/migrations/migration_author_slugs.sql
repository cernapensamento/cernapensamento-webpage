-- Añadir la columna slug a perfiles si no existe
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Función para generar un slug básico (quita acentos, convierte a minúsculas, cambia espacios por guiones)
CREATE OR REPLACE FUNCTION generate_slug(text) RETURNS text AS $$
  SELECT lower(
    regexp_replace(
      translate(
        $1,
        'áàâäãåçéèêëíìîïñóòôöõúùûüýÿÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ',
        'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY'
      ),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )
  );
$$ LANGUAGE sql IMMUTABLE;

-- Rellenar los slugs existentes de manera segura (con un sufijo de ID para evitar duplicados si hay nombres iguales)
UPDATE public.perfiles 
SET slug = generate_slug(nombre) || '-' || substr(id::text, 1, 4)
WHERE slug IS NULL;

-- Asegurar que los perfiles tengan siempre un slug.
-- (Normalmente, la app frontend creará el slug, esto es solo para los perfiles ya existentes).
