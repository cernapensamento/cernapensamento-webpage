    -- Borrar por si ya las habías creado                                                                    
    DROP TABLE IF EXISTS public.articulos;
    DROP TABLE IF EXISTS public.perfiles;
  
    -- 1. Crear tabla de perfiles ligada a auth.users (con rol 'usuario' incluido)
    CREATE TABLE public.perfiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      nombre TEXT NOT NULL,
      -- Agregamos 'usuario' y lo ponemos como default
      rol TEXT DEFAULT 'usuario' CHECK (rol IN ('usuario', 'escritor', 'admin'))
    );
  
    -- 2. Crear tabla de artículos
    CREATE TABLE public.articulos (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      titulo TEXT NOT NULL,
      contenido TEXT NOT NULL,
      imagen_url TEXT,
      creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      autor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL
    );
  
    -- Activar Row Level Security
    ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.articulos ENABLE ROW LEVEL SECURITY;
    
    -- Borrar el trigger anterior si existe
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
    -- Función actualizada
    CREATE OR REPLACE FUNCTION public.handle_new_user() 
    RETURNS TRIGGER AS $$
    BEGIN
    INSERT INTO public.perfiles (id, nombre, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'nombre', 'UsuarioNuevo'),
        'usuario'
    );
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  
    -- Trigger que llama a la función
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
