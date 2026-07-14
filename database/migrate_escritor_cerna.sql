-- Migrar artículos de Escritor Cerna a Anxo Pérez y eliminar al escritor antiguo
-- Ejecutar en el editor SQL de Supabase

DO $$
DECLARE
  old_autor_id UUID := 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';
  new_autor_id UUID := 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4';
  articulos_migrados INT;
BEGIN
  -- 1. Reasignar artículos del escritor antiguo al nuevo
  UPDATE public.articulos
  SET autor_id = new_autor_id
  WHERE autor_id = old_autor_id;

  GET DIAGNOSTICS articulos_migrados = ROW_COUNT;
  RAISE NOTICE 'Artículos migrados: %', articulos_migrados;

  -- 2. Eliminar el usuario antiguo (cascada a perfiles automáticamente)
  DELETE FROM auth.users WHERE id = old_autor_id;

  RAISE NOTICE 'Usuario Escritor Cerna eliminado correctamente.';
END $$;
