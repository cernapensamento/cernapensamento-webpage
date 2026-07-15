-- ==============================================================================
-- SETUP NEWSLETTER WEBHOOK
-- Crea la función segura para extraer correos y explica cómo crear el Webhook
-- ==============================================================================

-- 1. Función RPC segura para obtener los correos de los suscriptores.
-- Utiliza SECURITY DEFINER para saltarse RLS internamente y leer auth.users.
-- Requiere un secreto para evitar abusos si alguien encuentra el endpoint de la API.

CREATE OR REPLACE FUNCTION get_subscribers_emails(webhook_secret text)
RETURNS TABLE (email text, nombre text) AS $$
BEGIN
  -- Validar el secreto (debe coincidir con el WEBHOOK_SECRET en tu .env.local)
  IF webhook_secret != 'CERNA_WEBHOOK_SECRET_98765' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY 
  SELECT au.email::text, p.nombre 
  FROM auth.users au 
  JOIN public.perfiles p ON au.id = p.id 
  WHERE p.recibir_newsletter = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- INSTRUCCIONES PARA CONFIGURAR EL WEBHOOK EN SUPABASE
-- ==============================================================================
/*
Como tu base de datos está en la nube, la forma más fiable y fácil de configurar
el webhook que dispare tu API es a través del Panel de Control Web de Supabase:

1. Ve a https://app.supabase.com y entra a tu proyecto.
2. En el menú lateral izquierdo, ve a "Database" y luego a "Webhooks".
3. Haz clic en "Create a new Hook" (o "Enable Webhooks" si es la primera vez).
4. Configúralo así:
   - Name: Enviar Boletin Nuevos Articulos
   - Table: articulos
   - Events: Marca "Insert" y "Update"
   - Webhook URL: https://tudominio.com/api/webhooks/newsletter 
                  (Cambia tudominio.com por tu dominio real en producción. 
                   Si pruebas en local, puedes usar ngrok).
   - Method: POST
   - HTTP Headers:
       Añade un Header llamado:
       Authorization
       Con el valor:
       Bearer CERNA_WEBHOOK_SECRET_98765
5. Haz clic en "Create Webhook".

¡Listo! Supabase enviará los datos a tu Next.js y Next.js enviará los correos.
*/
