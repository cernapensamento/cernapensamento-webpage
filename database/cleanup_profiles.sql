-- Limpiar todos los perfiles excepto los creados recientemente
-- Reasigna artículos existentes al admin antes de eliminar
-- Ejecutar en el editor SQL de Supabase

DO $$
DECLARE
  ids_a_conservar UUID[] := ARRAY[
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', -- admin
    'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', -- Diego Araujo
    'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', -- Hector González
    'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', -- Denis Fernández
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', -- Anxo Pérez
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', -- Lucía Méndez
    'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', -- Martín Ríos
    'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', -- Clara Huerta
    'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4'  -- Santiago Gil
  ];
BEGIN
  -- 1. Reasignar artículos de perfiles a eliminar al admin
  UPDATE public.articulos
  SET autor_id = 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3'
  WHERE autor_id NOT IN (SELECT unnest(ids_a_conservar));

  -- 2. Eliminar perfiles no deseados (cascada a articulos ya reasignados)
  DELETE FROM public.perfiles
  WHERE id NOT IN (SELECT unnest(ids_a_conservar));

  -- 3. Eliminar auth.users correspondientes
  DELETE FROM auth.users
  WHERE id NOT IN (SELECT unnest(ids_a_conservar));

  RAISE NOTICE 'Limpieza completada. Perfiles conservados: 9.';
END $$;
