-- =======================================================
-- SEED_ESCRITORES.SQL - Creación de Escritores y Lectores de Prueba
-- Contraseña unificada para todos: 123456
-- =======================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  ids UUID[] := ARRAY[
    'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
    'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
    'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4'
  ];
  emails TEXT[] := ARRAY[
    'diegoaraujo@cerna.com',
    'hectorgonzalez@cerna.com',
    'denisfernandez@cerna.com',
    'anxoperez@cerna.com'
  ];
  nombres TEXT[] := ARRAY[
    'Diego Araujo',
    'Hector González',
    'Denis Fernández',
    'Anxo Pérez'
  ];
  lectorIds UUID[] := ARRAY[
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
    'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3',
    'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4'
  ];
  lectorEmails TEXT[] := ARRAY[
    'lector1@cerna.com',
    'lector2@cerna.com',
    'lector3@cerna.com',
    'lector4@cerna.com'
  ];
  lectorNombres TEXT[] := ARRAY[
    'Lucía Méndez',
    'Martín Ríos',
    'Clara Huerta',
    'Santiago Gil'
  ];
  i INT;
BEGIN
  -- Escritores
  FOR i IN 1..array_length(ids, 1) LOOP
    DELETE FROM auth.users WHERE email = emails[i];

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      ids[i],
      'authenticated',
      'authenticated',
      emails[i],
      crypt('123456', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('nombre', nombres[i]),
      now(),
      now(),
      '', '', '', ''
    );

    UPDATE public.perfiles
    SET rol = 'escritor', nombre = nombres[i]
    WHERE id = ids[i];
  END LOOP;

  -- Lectores (rol 'usuario' por defecto, solo actualizamos nombre)
  FOR i IN 1..array_length(lectorIds, 1) LOOP
    DELETE FROM auth.users WHERE email = lectorEmails[i];

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      lectorIds[i],
      'authenticated',
      'authenticated',
      lectorEmails[i],
      crypt('123456', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('nombre', lectorNombres[i]),
      now(),
      now(),
      '', '', '', ''
    );

    UPDATE public.perfiles
    SET nombre = lectorNombres[i]
    WHERE id = lectorIds[i];
  END LOOP;
END $$;
