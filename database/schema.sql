-- ==========================================
-- SCHEMA.SQL - Inicialización Unificada
-- ==========================================

-- 1. Limpieza inicial (DROP)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.comentarios CASCADE;
DROP TABLE IF EXISTS public.articulos CASCADE;
DROP TABLE IF EXISTS public.perfiles CASCADE;
DROP TABLE IF EXISTS public.suscriptores CASCADE;

-- 2. Crear tabla de perfiles ligada a auth.users
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  recibir_newsletter BOOLEAN DEFAULT TRUE,
  rol TEXT DEFAULT 'usuario' CHECK (rol IN ('usuario', 'escritor', 'admin'))
);

-- 3. Crear tabla de artículos
CREATE TABLE public.articulos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  contenido TEXT NOT NULL,
  tematicas TEXT[] DEFAULT '{}',
  imagen_url TEXT,
  estado TEXT DEFAULT 'publicado' CHECK (estado IN ('borrador', 'publicado')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  autor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL
);

-- 3.5 Crear tabla de comentarios
CREATE TABLE public.comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  articulo_id UUID REFERENCES public.articulos(id) ON DELETE CASCADE NOT NULL,
  autor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
  contenido TEXT NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Función automática para actualizar 'actualizado_en' en articulos
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articulos_updated_at
BEFORE UPDATE ON public.articulos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comentarios_updated_at
BEFORE UPDATE ON public.comentarios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. Función para sincronizar nuevos usuarios desde Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol, recibir_newsletter)
  VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'nombre', 'UsuarioNuevo'),
      'usuario',
      TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que llama a la función
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- POLÍTICAS RLS (Seguridad)
-- ==========================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- PERFILES
CREATE POLICY "Perfiles publicos para leer"
  ON public.perfiles FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.perfiles FOR UPDATE
  USING (auth.uid() = id);

-- ARTICULOS
CREATE POLICY "Artículos públicos para leer"
  ON public.articulos FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden crear sus propios artículos"
  ON public.articulos FOR INSERT
  WITH CHECK (
    auth.uid() = autor_id 
    AND (SELECT rol FROM public.perfiles WHERE id = auth.uid()) IN ('escritor', 'admin')
  );

CREATE POLICY "Usuarios pueden actualizar sus propios artículos"
  ON public.articulos FOR UPDATE
  USING (auth.uid() = autor_id AND (SELECT rol FROM public.perfiles WHERE id = auth.uid()) IN ('escritor', 'admin'))
  WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Usuarios pueden borrar sus propios artículos"
  ON public.articulos FOR DELETE
  USING (auth.uid() = autor_id AND (SELECT rol FROM public.perfiles WHERE id = auth.uid()) IN ('escritor', 'admin'));

-- COMENTARIOS
CREATE POLICY "Comentarios públicos para leer"
  ON public.comentarios FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear comentarios"
  ON public.comentarios FOR INSERT
  WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Usuarios pueden actualizar sus propios comentarios"
  ON public.comentarios FOR UPDATE
  USING (auth.uid() = autor_id)
  WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Usuarios pueden borrar sus propios comentarios"
  ON public.comentarios FOR DELETE
  USING (auth.uid() = autor_id);

-- ==========================================
-- BUCKETS Y STORAGE
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('imagenes-articulos', 'imagenes-articulos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imágenes públicas para lectura" ON storage.objects;
CREATE POLICY "Imágenes públicas para lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'imagenes-articulos');

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'imagenes-articulos' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias imágenes" ON storage.objects;
CREATE POLICY "Usuarios pueden actualizar sus propias imágenes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'imagenes-articulos' 
    AND auth.uid() = owner
  );

DROP POLICY IF EXISTS "Usuarios pueden borrar sus propias imágenes" ON storage.objects;
CREATE POLICY "Usuarios pueden borrar sus propias imágenes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'imagenes-articulos' 
    AND auth.uid() = owner
  );
