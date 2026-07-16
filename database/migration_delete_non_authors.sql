-- =======================================================
-- MIGRATION: Borrar todos los usuarios excepto autores
-- =======================================================

-- Esto eliminará de auth.users a todas las cuentas que no sean 
-- 'escritor' o 'admin'. Al eliminarlos de auth.users, la base
-- de datos eliminará en cascada sus perfiles en public.perfiles.

DELETE FROM auth.users 
WHERE id IN (
  SELECT id FROM public.perfiles 
  WHERE rol NOT IN ('escritor', 'admin')
);
