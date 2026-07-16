-- =======================================================
-- SEED_ROLES.SQL - Creación de Usuarios de Prueba con Roles
-- Contraseña unificada para todos: 123456
-- =======================================================

-- Habilitar pgcrypto para poder encriptar contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Limpiar usuarios anteriores de prueba si existen en auth.users
-- Esto también limpiará sus perfiles correspondientes por ON DELETE CASCADE
DELETE FROM auth.users WHERE email IN ('lector@cernapensamento.org', 'escritor@cernapensamento.org', 'admin@cernapensamento.org');

-- 1. Crear Usuario Lector (Rol: usuario por defecto)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'authenticated',
  'authenticated',
  'lector@cernapensamento.org',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Lector Cerna"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 2. Crear Usuario Escritor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
  'authenticated',
  'authenticated',
  'escritor@cernapensamento.org',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Escritor Cerna"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Actualizar el rol del escritor en public.perfiles (el disparador lo habrá creado como 'usuario')
UPDATE public.perfiles
SET rol = 'escritor'
WHERE id = 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';

-- 3. Crear Usuario Administrador
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
  'authenticated',
  'authenticated',
  'admin@cernapensamento.org',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Administrador Cerna"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Actualizar el rol del administrador en public.perfiles
UPDATE public.perfiles
SET rol = 'admin'
WHERE id = 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3';
