-- script4.sql
-- Crea la tabla de suscriptores para el newsletter

CREATE TABLE IF NOT EXISTS public.suscriptores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.suscriptores ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede suscribirse (insertar)
CREATE POLICY "Permitir insertar suscriptores anónimos" ON public.suscriptores
    FOR INSERT WITH CHECK (true);

-- Solo administradores pueden ver los suscriptores
CREATE POLICY "Permitir leer suscriptores a admins" ON public.suscriptores
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.perfiles WHERE rol = 'admin')
    );
