


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






CREATE TYPE "public"."publication_status" AS ENUM (
    'draft',
    'in_review',
    'published'
);


ALTER TYPE "public"."publication_status" OWNER TO "postgres";


CREATE TYPE "public"."publication_type" AS ENUM (
    'article',
    'essay',
    'reportage',
    'column',
    'interview',
    'poetry',
    'news'
);


ALTER TYPE "public"."publication_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'reader',
    'guest',
    'member',
    'founder',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_publication_quotas"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_role public.user_role;
  v_total_count int;
  v_year_count int;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = NEW.author_id;

  IF v_role = 'guest' THEN
    SELECT count(*) INTO v_total_count FROM public.publications WHERE author_id = NEW.author_id;
    IF v_total_count >= 4 THEN
      RAISE EXCEPTION 'Límite total alcanzado: Un autor invitado no puede crear más de 4 publicaciones en total.';
    END IF;

    SELECT count(*) INTO v_year_count FROM public.publications
    WHERE author_id = NEW.author_id
      AND extract(year from created_at) = extract(year from now());
    IF v_year_count >= 2 THEN
      RAISE EXCEPTION 'Límite anual alcanzado: Un autor invitado no puede crear más de 2 publicaciones este año.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_publication_quotas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  claims jsonb;
  v_user_role public.user_role;
BEGIN
  -- Fetch user role directly from public.users
  SELECT role INTO v_user_role FROM public.users WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF v_user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata, user_role}', to_jsonb(v_user_role::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_user_role::text));
  ELSE
    claims := jsonb_set(claims, '{app_metadata, user_role}', '"reader"'::jsonb);
    claims := jsonb_set(claims, '{user_role}', '"reader"'::jsonb);
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") RETURNS TABLE("email" "text", "full_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  expected_secret text;
BEGIN
  expected_secret := COALESCE(current_setting('app.settings.webhook_secret', true), 'CERNA_WEBHOOK_SECRET_98765');

  IF auth.role() != 'service_role' AND webhook_secret != expected_secret AND webhook_secret != 'CERNA_WEBHOOK_SECRET_98765' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT au.email::text, u.full_name
  FROM auth.users au
  JOIN public.users u ON au.id = u.id
  WHERE u.newsletter_subscribed = TRUE;
END;
$$;


ALTER FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unsubscribe_newsletter_by_email"("target_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email) LIMIT 1;
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.users
  SET newsletter_subscribed = FALSE
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."unsubscribe_newsletter_by_email"("target_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, role, newsletter_subscribed)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'nombre',
      'UsuarioNuevo'
    ),
    NEW.raw_user_meta_data ->> 'avatar_url',
    'reader'::public.user_role,
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
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "publication_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publication_tags" (
    "publication_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."publication_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text",
    "cover_image_url" "text",
    "status" "public"."publication_status" DEFAULT 'published'::"public"."publication_status",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "author_id" "uuid" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "type" "public"."publication_type" DEFAULT 'article'::"public"."publication_type",
    "original_language" "text" DEFAULT 'gl'::"text",
    "title" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "subtitle" "jsonb" DEFAULT '{}'::"jsonb",
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "newsletter_sent_at" timestamp with time zone,
    CONSTRAINT "publications_content_bilingual_check" CHECK ((("content" ? 'gl'::"text") AND ("content" ? 'es'::"text") AND ("length"(TRIM(BOTH FROM ("content" ->> 'gl'::"text"))) > 0) AND ("length"(TRIM(BOTH FROM ("content" ->> 'es'::"text"))) > 0))),
    CONSTRAINT "publications_original_language_check" CHECK (("original_language" = ANY (ARRAY['gl'::"text", 'es'::"text"]))),
    CONSTRAINT "publications_subtitle_bilingual_check" CHECK ((("subtitle" IS NULL) OR ("subtitle" = '{}'::"jsonb") OR (("subtitle" ? 'gl'::"text") AND ("subtitle" ? 'es'::"text")))),
    CONSTRAINT "publications_title_bilingual_check" CHECK ((("title" ? 'gl'::"text") AND ("title" ? 'es'::"text") AND ("length"(TRIM(BOTH FROM ("title" ->> 'gl'::"text"))) > 0) AND ("length"(TRIM(BOTH FROM ("title" ->> 'es'::"text"))) > 0)))
);


ALTER TABLE "public"."publications" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "bio" "jsonb" DEFAULT '{}'::"jsonb",
    "avatar_url" "text",
    "newsletter_subscribed" boolean DEFAULT true,
    "role" "public"."user_role" DEFAULT 'reader'::"public"."user_role",
    "slug" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_publication_key" UNIQUE ("author_id", "publication_id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publication_tags"
    ADD CONSTRAINT "publication_tags_pkey" PRIMARY KEY ("publication_id", "tag_id");



ALTER TABLE ONLY "public"."publications"
    ADD CONSTRAINT "publications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publications"
    ADD CONSTRAINT "publications_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tag_translations"
    ADD CONSTRAINT "tag_translations_pkey" PRIMARY KEY ("tag_id", "lang");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_comments_author_id" ON "public"."comments" USING "btree" ("author_id");



CREATE INDEX "idx_comments_publication_id" ON "public"."comments" USING "btree" ("publication_id");



CREATE INDEX "idx_publication_tags_publication_id" ON "public"."publication_tags" USING "btree" ("publication_id");



CREATE INDEX "idx_publication_tags_tag_id" ON "public"."publication_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_publications_author_id" ON "public"."publications" USING "btree" ("author_id");



CREATE INDEX "idx_publications_status_created" ON "public"."publications" USING "btree" ("status", "created_at" DESC);



CREATE OR REPLACE TRIGGER "before_insert_publication_quota" BEFORE INSERT ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."check_publication_quotas"();



CREATE OR REPLACE TRIGGER "on_publication_published_newsletter" AFTER INSERT OR UPDATE ON "public"."publications" FOR EACH ROW WHEN (NEW.status = 'published' AND NEW.newsletter_sent_at IS NULL) EXECUTE FUNCTION "supabase_functions"."http_request"('https://cernapensamento.org/api/webhooks/newsletter', 'POST', '{"Authorization":"Bearer CERNA_WEBHOOK_SECRET_98765"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_publications_updated_at" BEFORE UPDATE ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publication_tags"
    ADD CONSTRAINT "publication_tags_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publication_tags"
    ADD CONSTRAINT "publication_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publications"
    ADD CONSTRAINT "publications_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_translations"
    ADD CONSTRAINT "tag_translations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors and Admins can delete publications" ON "public"."publications" FOR DELETE USING ((("auth"."uid"() = "author_id") AND (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'user_role'::"text"), ( SELECT ("users"."role")::"text" AS "role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) = ANY (ARRAY['founder'::"text", 'admin'::"text"]))));



CREATE POLICY "Authors can insert publications" ON "public"."publications" FOR INSERT WITH CHECK ((("auth"."uid"() = "author_id") AND (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'user_role'::"text"), ( SELECT ("users"."role")::"text" AS "role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) = ANY (ARRAY['guest'::"text", 'member'::"text", 'founder'::"text", 'admin'::"text"]))));



CREATE POLICY "Authors can update own publications" ON "public"."publications" FOR UPDATE USING ((("auth"."uid"() = "author_id") AND (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'user_role'::"text"), ( SELECT ("users"."role")::"text" AS "role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) = ANY (ARRAY['guest'::"text", 'member'::"text", 'founder'::"text", 'admin'::"text"])))) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Editores pueden crear tags" ON "public"."tags" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Editores pueden traducir tags" ON "public"."tag_translations" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Editors can manage publication tags" ON "public"."publication_tags" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'user_role'::"text"), ( SELECT ("users"."role")::"text" AS "role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) = ANY (ARRAY['founder'::"text", 'admin'::"text", 'member'::"text"])));



CREATE POLICY "Etiquetas visibles para todos" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Public read comments" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Public read publication tags" ON "public"."publication_tags" FOR SELECT USING (true);



CREATE POLICY "Public read published publications" ON "public"."publications" FOR SELECT USING ((("status" = 'published'::"public"."publication_status") OR ("auth"."uid"() = "author_id")));



CREATE POLICY "Public read user profiles" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Traducciones de etiquetas visibles para todos" ON "public"."tag_translations" FOR SELECT USING (true);



CREATE POLICY "Users can delete own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publication_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";






















































































































































GRANT ALL ON FUNCTION "public"."check_publication_quotas"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_publication_quotas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_publication_quotas"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



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


















GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."publication_tags" TO "anon";
GRANT ALL ON TABLE "public"."publication_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."publication_tags" TO "service_role";



GRANT ALL ON TABLE "public"."publications" TO "anon";
GRANT ALL ON TABLE "public"."publications" TO "authenticated";
GRANT ALL ON TABLE "public"."publications" TO "service_role";



GRANT ALL ON TABLE "public"."tag_translations" TO "anon";
GRANT ALL ON TABLE "public"."tag_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_translations" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT SELECT ON TABLE "public"."users" TO "supabase_auth_admin";









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































