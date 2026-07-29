SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";


COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";



CREATE OR REPLACE FUNCTION "public"."check_article_quotas"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_rol TEXT;
  v_total_count INT;
  v_year_count INT;
BEGIN
  -- Obtener el rol del usuario que inserta
  SELECT rol INTO v_rol FROM public.perfiles WHERE id = NEW.autor_id;
  
  IF v_rol = 'invitado' THEN
    -- Contar total
    SELECT count(*) INTO v_total_count FROM public.articulos WHERE autor_id = NEW.autor_id;
    IF v_total_count >= 4 THEN
      RAISE EXCEPTION 'Límite total alcanzado: Un autor invitado no puede crear más de 4 artículos en total.';
    END IF;
    
    -- Contar año actual
    SELECT count(*) INTO v_year_count FROM public.articulos 
    WHERE autor_id = NEW.autor_id 
      AND extract(year from creado_en) = extract(year from now());
    IF v_year_count >= 2 THEN
      RAISE EXCEPTION 'Límite anual alcanzado: Un autor invitado no puede crear más de 2 artículos este año.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_article_quotas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_slug"("text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $_$
      SELECT lower(
        regexp_replace(
          translate(
            $1,
            'áàâäãåçéèêëíìîïñóòôöõúùûüýÿÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ',
            'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY'
          ),
          '[^a-zA-Z0-9]+',
          '-',
          'g'
        )
      );
    $_$;


ALTER FUNCTION "public"."generate_slug"("text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") RETURNS TABLE("email" "text", "nombre" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
    BEGIN
      -- Validar el secreto de seguridad
      IF webhook_secret != 'CERNA_WEBHOOK_SECRET_98765' THEN
        RAISE EXCEPTION 'No autorizado';
      END IF;

      -- Devolver correos cruzando Auth con Perfiles
      RETURN QUERY
      SELECT au.email::text, p.nombre
      FROM auth.users au
      JOIN public.perfiles p ON au.id = p.id
      WHERE p.recibir_newsletter = TRUE;
    END;
    $$;


ALTER FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
    BEGIN
      INSERT INTO public.perfiles (id, nombre, avatar_url, rol, recibir_newsletter)
      VALUES (
          NEW.id,
          COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',  -- De Google OAuth
            NEW.raw_user_meta_data ->> 'nombre',     -- De Correo/Contraseña
            'UsuarioNuevo'                           -- Por si acaso
          ),
          NEW.raw_user_meta_data ->> 'avatar_url',   -- Imagen de Google (si existe)
          'usuario',
          TRUE
      );
      RETURN NEW;
    END;
    $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.actualizado_en = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."article_tags" (
    "article_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."article_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."articulos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text",
    "tematicas" "text"[] DEFAULT '{}'::"text"[],
    "imagen_url" "text",
    "estado" "text" DEFAULT 'publicado'::"text",
    "creado_en" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "autor_id" "uuid" NOT NULL,
    "fijado" boolean DEFAULT false,
    "tipo" "text" DEFAULT 'artigo'::"text",
    "idioma_original" "text" DEFAULT 'gl'::"text",
    "titulo_gl" "text" NOT NULL,
    "titulo_es" "text" NOT NULL,
    "subtitulo_gl" "text",
    "subtitulo_es" "text",
    "contenido_gl" "text" NOT NULL,
    "contenido_es" "text" NOT NULL,
    CONSTRAINT "articulos_estado_check" CHECK (("estado" = ANY (ARRAY['borrador'::"text", 'publicado'::"text"]))),
    CONSTRAINT "articulos_idioma_original_check" CHECK (("idioma_original" = ANY (ARRAY['gl'::"text", 'es'::"text"]))),
    CONSTRAINT "articulos_tipo_check" CHECK (("tipo" = ANY (ARRAY['artigo'::"text", 'ensaio'::"text", 'reportaxe'::"text", 'columna'::"text", 'entrevista'::"text", 'poesía'::"text"])))
);


ALTER TABLE "public"."articulos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comentarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "articulo_id" "uuid" NOT NULL,
    "autor_id" "uuid" NOT NULL,
    "contenido" "text" NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."comentarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfiles" (
    "id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "bio" "text",
    "avatar_url" "text",
    "recibir_newsletter" boolean DEFAULT true,
    "rol" "text" DEFAULT 'usuario'::"text",
    "slug" "text",
    CONSTRAINT "perfiles_rol_check" CHECK (("rol" = ANY (ARRAY['usuario'::"text", 'escritor'::"text", 'admin'::"text", 'invitado'::"text"])))
);


ALTER TABLE "public"."perfiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag_translations" (
    "tag_id" "uuid" NOT NULL,
    "lang" character varying(2) NOT NULL,
    "name" character varying NOT NULL
);


ALTER TABLE "public"."tag_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


ALTER TABLE ONLY "public"."article_tags"
    ADD CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id", "tag_id");



ALTER TABLE ONLY "public"."articulos"
    ADD CONSTRAINT "articulos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."articulos"
    ADD CONSTRAINT "articulos_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."comentarios"
    ADD CONSTRAINT "comentarios_autor_articulo_key" UNIQUE ("autor_id", "articulo_id");



ALTER TABLE ONLY "public"."comentarios"
    ADD CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tag_translations"
    ADD CONSTRAINT "tag_translations_pkey" PRIMARY KEY ("tag_id", "lang");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_articulos_autor_id" ON "public"."articulos" USING "btree" ("autor_id");



CREATE INDEX "idx_articulos_estado_creado" ON "public"."articulos" USING "btree" ("estado", "creado_en" DESC);



CREATE INDEX "idx_comentarios_articulo_id" ON "public"."comentarios" USING "btree" ("articulo_id");



CREATE INDEX "idx_comentarios_autor_id" ON "public"."comentarios" USING "btree" ("autor_id");



CREATE OR REPLACE TRIGGER "Enviar Boletin Nuevos Articulos" AFTER INSERT OR UPDATE ON "public"."articulos" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://cernapensamento.org/api/webhooks/newsletter', 'POST', '{"Authorization":"Bearer CERNA_WEBHOOK_SECRET_98765"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "before_insert_articulo_quota" BEFORE INSERT ON "public"."articulos" FOR EACH ROW EXECUTE FUNCTION "public"."check_article_quotas"();



CREATE OR REPLACE TRIGGER "update_articulos_updated_at" BEFORE UPDATE ON "public"."articulos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comentarios_updated_at" BEFORE UPDATE ON "public"."comentarios" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."article_tags"
    ADD CONSTRAINT "article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articulos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_tags"
    ADD CONSTRAINT "article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."articulos"
    ADD CONSTRAINT "articulos_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "public"."perfiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios"
    ADD CONSTRAINT "comentarios_articulo_id_fkey" FOREIGN KEY ("articulo_id") REFERENCES "public"."articulos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios"
    ADD CONSTRAINT "comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "public"."perfiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_translations"
    ADD CONSTRAINT "tag_translations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



CREATE POLICY "Artículos públicos para leer" ON "public"."articulos" FOR SELECT USING (true);



CREATE POLICY "Comentarios públicos para leer" ON "public"."comentarios" FOR SELECT USING (true);



CREATE POLICY "Editores pueden asignar tags" ON "public"."article_tags" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Editores pueden crear tags" ON "public"."tags" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Editores pueden traducir tags" ON "public"."tag_translations" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Etiquetas visibles para todos" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Perfiles publicos para leer" ON "public"."perfiles" FOR SELECT USING (true);



CREATE POLICY "Tags de artículos visibles para todos" ON "public"."article_tags" FOR SELECT USING (true);



CREATE POLICY "Traducciones de etiquetas visibles para todos" ON "public"."tag_translations" FOR SELECT USING (true);



CREATE POLICY "Usuarios autenticados pueden crear comentarios" ON "public"."comentarios" FOR INSERT WITH CHECK (("auth"."uid"() = "autor_id"));



CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON "public"."perfiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Usuarios pueden actualizar sus propios artículos" ON "public"."articulos" FOR UPDATE USING ((("auth"."uid"() = "autor_id") AND (( SELECT "perfiles"."rol"
   FROM "public"."perfiles"
  WHERE ("perfiles"."id" = "auth"."uid"())) = ANY (ARRAY['escritor'::"text", 'admin'::"text", 'invitado'::"text"])))) WITH CHECK (("auth"."uid"() = "autor_id"));



CREATE POLICY "Usuarios pueden actualizar sus propios comentarios" ON "public"."comentarios" FOR UPDATE USING (("auth"."uid"() = "autor_id")) WITH CHECK (("auth"."uid"() = "autor_id"));



CREATE POLICY "Usuarios pueden borrar sus propios artículos" ON "public"."articulos" FOR DELETE USING ((("auth"."uid"() = "autor_id") AND (( SELECT "perfiles"."rol"
   FROM "public"."perfiles"
  WHERE ("perfiles"."id" = "auth"."uid"())) = ANY (ARRAY['escritor'::"text", 'admin'::"text", 'invitado'::"text"]))));



CREATE POLICY "Usuarios pueden borrar sus propios comentarios" ON "public"."comentarios" FOR DELETE USING (("auth"."uid"() = "autor_id"));



CREATE POLICY "Usuarios pueden crear sus propios artículos" ON "public"."articulos" FOR INSERT WITH CHECK ((("auth"."uid"() = "autor_id") AND (( SELECT "perfiles"."rol"
   FROM "public"."perfiles"
  WHERE ("perfiles"."id" = "auth"."uid"())) = ANY (ARRAY['escritor'::"text", 'admin'::"text", 'invitado'::"text"]))));



ALTER TABLE "public"."article_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."articulos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comentarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."perfiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_article_quotas"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_article_quotas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_article_quotas"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_slug"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."article_tags" TO "anon";
GRANT ALL ON TABLE "public"."article_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."article_tags" TO "service_role";



GRANT ALL ON TABLE "public"."articulos" TO "anon";
GRANT ALL ON TABLE "public"."articulos" TO "authenticated";
GRANT ALL ON TABLE "public"."articulos" TO "service_role";



GRANT ALL ON TABLE "public"."comentarios" TO "anon";
GRANT ALL ON TABLE "public"."comentarios" TO "authenticated";
GRANT ALL ON TABLE "public"."comentarios" TO "service_role";



GRANT ALL ON TABLE "public"."perfiles" TO "anon";
GRANT ALL ON TABLE "public"."perfiles" TO "authenticated";
GRANT ALL ON TABLE "public"."perfiles" TO "service_role";



GRANT ALL ON TABLE "public"."tag_translations" TO "anon";
GRANT ALL ON TABLE "public"."tag_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_translations" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
