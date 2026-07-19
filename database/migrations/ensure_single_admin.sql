-- Crear un índice único parcial para asegurar que solo exista un admin
-- Si alguien intenta poner rol='admin' a otro perfil y ya existe uno, la base de datos lanzará un error.

CREATE UNIQUE INDEX IF NOT EXISTS only_one_admin_idx 
ON public.perfiles (rol) 
WHERE rol = 'admin';
