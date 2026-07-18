-- Actualizar el trigger para leer los datos de Google (full_name y avatar_url)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  base_nombre TEXT;
  nuevo_slug TEXT;
BEGIN
  -- Extraer el nombre
  base_nombre := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',  -- Google OAuth
    NEW.raw_user_meta_data ->> 'nombre',     -- Email/Password
    'UsuarioNuevo'                           -- Fallback
  );

  -- Generar slug único base_nombre + sufijo corto del id
  nuevo_slug := lower(
    regexp_replace(
      translate(
        base_nombre,
        'áàâäãåçéèêëíìîïñóòôöõúùûüýÿÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ',
        'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY'
      ),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )
  ) || '-' || substr(NEW.id::text, 1, 4);

  INSERT INTO public.perfiles (id, nombre, slug, avatar_url, rol, recibir_newsletter)
  VALUES (
      NEW.id,
      base_nombre,
      nuevo_slug,
      NEW.raw_user_meta_data ->> 'avatar_url',   -- Imagen de Google (si existe)
      'usuario',
      TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
