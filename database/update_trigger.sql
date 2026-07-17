-- Actualizar el trigger para leer los datos de Google (full_name y avatar_url)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, avatar_url, rol, recibir_newsletter)
  VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data ->> 'full_name',  -- Google OAuth
        NEW.raw_user_meta_data ->> 'nombre',     -- Email/Password
        'UsuarioNuevo'                           -- Fallback
      ),
      NEW.raw_user_meta_data ->> 'avatar_url',   -- Imagen de Google (si existe)
      'usuario',
      TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
