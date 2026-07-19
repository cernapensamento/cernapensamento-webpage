-- Ejecuta este script en el SQL Editor de Supabase para limpiar los slugs de los autores principales

UPDATE public.perfiles SET slug = 'diego-araujo' WHERE id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1';
UPDATE public.perfiles SET slug = 'hector-gonzalez' WHERE id = 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2';
UPDATE public.perfiles SET slug = 'denis-fernandez' WHERE id = 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3';
UPDATE public.perfiles SET slug = 'anxo-perez' WHERE id = 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4';

-- Para otros perfiles (lectores, admin), si quieres que tampoco tengan los últimos 4 dígitos:
-- UPDATE public.perfiles SET slug = generate_slug(nombre) WHERE slug LIKE '%-%' AND id NOT IN ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4');
