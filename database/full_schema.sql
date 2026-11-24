


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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






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
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_role public.user_role;
  v_total_count int;
  v_year_count int;
BEGIN
  -- Always enforce server-authoritative timestamps on publication creation
  NEW.created_at := timezone('utc'::text, now());
  NEW.updated_at := timezone('utc'::text, now());

  SELECT role INTO v_role FROM public.users WHERE id = NEW.author_id;

  IF v_role = 'guest' THEN
    SELECT count(*) INTO v_total_count FROM public.publications WHERE author_id = NEW.author_id;
    IF v_total_count >= 4 THEN
      RAISE EXCEPTION 'Límite total alcanzado: Un autor invitado no puede crear más de 4 publicaciones en total.';
    END IF;

    SELECT count(*) INTO v_year_count FROM public.publications
    WHERE author_id = NEW.author_id
      AND extract(year from created_at) = extract(year from NEW.created_at);
    IF v_year_count >= 2 THEN
      RAISE EXCEPTION 'Límite anual alcanzado: Un autor invitado no puede crear más de 2 publicaciones este año.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_publication_quotas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text,
    (SELECT (users.role)::text FROM public.users WHERE users.id = auth.uid())
  );
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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

SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    "published_at" timestamp with time zone,
    "show_index" boolean DEFAULT false NOT NULL,
    CONSTRAINT "publications_language_content_check" CHECK ((("jsonb_typeof"("title") = 'object'::"text") AND ("jsonb_typeof"("content") = 'object'::"text") AND
CASE
    WHEN ("status" = 'draft'::"public"."publication_status") THEN (("length"("btrim"(COALESCE(("title" ->> 'gl'::"text"), ''::"text"))) > 0) OR ("length"("btrim"(COALESCE(("title" ->> 'es'::"text"), ''::"text"))) > 0) OR ("length"("btrim"(COALESCE(("content" ->> 'gl'::"text"), ''::"text"))) > 0) OR ("length"("btrim"(COALESCE(("content" ->> 'es'::"text"), ''::"text"))) > 0))
    ELSE (("original_language" IS NOT NULL) AND ("length"("btrim"(COALESCE(("title" ->> "original_language"), ''::"text"))) > 0) AND ("length"("btrim"(COALESCE(("content" ->> "original_language"), ''::"text"))) > 0) AND (("length"("btrim"(COALESCE(("title" ->> 'gl'::"text"), ''::"text"))) > 0) = ("length"("btrim"(COALESCE(("content" ->> 'gl'::"text"), ''::"text"))) > 0)) AND (("length"("btrim"(COALESCE(("title" ->> 'es'::"text"), ''::"text"))) > 0) = ("length"("btrim"(COALESCE(("content" ->> 'es'::"text"), ''::"text"))) > 0)))
END)),
    CONSTRAINT "publications_original_language_format_check" CHECK (("original_language" ~ '^[a-z]{2,5}(-[a-zA-Z0-9]{2,5})?$'::"text")),
    CONSTRAINT "publications_subtitle_jsonb_object_check" CHECK ((("subtitle" IS NULL) OR ("jsonb_typeof"("subtitle") = 'object'::"text")))
);


ALTER TABLE "public"."publications" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dispatch_newsletter_webhook"("publication" "public"."publications") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_secret text;
  v_site_url text;
  v_url text;
  v_headers jsonb;
  v_request_id bigint;
BEGIN
  -- Count even configuration/enqueue failures so every automatic path is bounded.
  UPDATE public.newsletter_dispatches
  SET attempts = attempts + 1,
      next_attempt_at = now() + interval '1 minute' * power(2, attempts)
  WHERE publication_id = publication.id AND attempts < 5;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  BEGIN
    v_secret := current_setting('app.settings.webhook_secret', true);
    IF v_secret IS NULL OR v_secret = '' THEN
      SELECT decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets
      WHERE name = 'app.settings.webhook_secret' OR name = 'webhook_secret'
      LIMIT 1;
    END IF;

    IF v_secret IS NULL OR v_secret = '' THEN
      RAISE EXCEPTION 'app.settings.webhook_secret is not set. Webhook skipped.';
    END IF;

    v_site_url := COALESCE(current_setting('app.settings.site_url', true), 'https://cernapensamento.org');
    IF v_site_url !~* '^https://' THEN
      RAISE EXCEPTION 'Newsletter webhook requires HTTPS';
    END IF;

    v_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    );
    v_url := v_site_url || '/api/webhooks/newsletter';

    v_request_id := net.http_post(
      url := v_url,
      body := jsonb_build_object('record', row_to_json(publication)),
      headers := v_headers,
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    -- Do not include the URL, headers, or provider error text in logs.
    RAISE WARNING 'Newsletter webhook dispatch skipped (SQLSTATE %).', SQLSTATE;
  END;

  UPDATE public.newsletter_dispatches
  SET request_id = v_request_id,
      status = CASE WHEN v_request_id IS NOT NULL THEN 'dispatched'
                    WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
      next_attempt_at = CASE WHEN v_request_id IS NULL AND attempts >= 5 THEN NULL
                            ELSE next_attempt_at END
  WHERE publication_id = publication.id;
END;
$$;


ALTER FUNCTION "public"."dispatch_newsletter_webhook"("publication" "public"."publications") OWNER TO "postgres";


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
    SET "search_path" TO ''
    AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: service_role required';
  END IF;

  RETURN QUERY
  SELECT au.email::text, u.full_name::text
  FROM auth.users au
  JOIN public.users u ON au.id = u.id
  WHERE u.newsletter_subscribed = TRUE AND au.email IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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
    FALSE
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_operator"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT public.current_user_role() = ANY (ARRAY['founder'::text, 'admin'::text]);
$$;


ALTER FUNCTION "public"."is_operator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_writer"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT public.current_user_role() = ANY (ARRAY['guest'::text, 'member'::text, 'founder'::text, 'admin'::text]);
$$;


ALTER FUNCTION "public"."is_writer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reconcile_newsletter_dispatches"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_publication public.publications;
  v_dispatch public.newsletter_dispatches;
  v_response net._http_response;
BEGIN
  -- SKIP LOCKED allows concurrent runs without duplicating sends or blocking claims.
  FOR v_publication IN
    SELECT p.* FROM public.publications p
    JOIN public.newsletter_dispatches d ON d.publication_id = p.id
    WHERE p.status = 'published' AND p.newsletter_sent_at IS NULL
      AND d.status IN ('pending', 'dispatched') AND d.next_attempt_at <= now()
    ORDER BY d.next_attempt_at, p.id
    LIMIT 100
    FOR UPDATE OF p SKIP LOCKED
  LOOP
    SELECT * INTO v_dispatch FROM public.newsletter_dispatches
    WHERE publication_id = v_publication.id FOR UPDATE;

    IF v_dispatch.status = 'dispatched' THEN
      SELECT * INTO v_response FROM net._http_response WHERE id = v_dispatch.request_id;
      IF FOUND THEN
        UPDATE public.newsletter_dispatches SET last_status_code = v_response.status_code
        WHERE publication_id = v_publication.id;
        IF v_response.status_code BETWEEN 200 AND 299
           AND NOT COALESCE(v_response.timed_out, false) AND v_response.error_msg IS NULL THEN
          UPDATE public.newsletter_dispatches SET status = 'completed', next_attempt_at = NULL
          WHERE publication_id = v_publication.id;
          CONTINUE;
        END IF;
      ELSIF EXISTS (SELECT 1 FROM net.http_request_queue WHERE id = v_dispatch.request_id) THEN
        -- A stalled worker must not accumulate copies of the same queued request.
        CONTINUE;
      END IF;
      -- Missing/expired responses and transport/non-2xx failures retry only after backoff.
    END IF;

    IF v_dispatch.attempts >= 5 THEN
      UPDATE public.newsletter_dispatches SET status = 'failed', next_attempt_at = NULL
      WHERE publication_id = v_publication.id;
    ELSE
      PERFORM public.dispatch_newsletter_webhook(v_publication);
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."reconcile_newsletter_dispatches"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_publication_published_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'published'::public.publication_status THEN
    -- If becoming published for the first time or republishing after draft:
    IF TG_OP = 'INSERT' AND NEW.published_at IS NULL THEN
      NEW.published_at := timezone('utc'::text, now());
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.status IS DISTINCT FROM 'published'::public.publication_status AND NEW.published_at IS NULL THEN
        NEW.published_at := timezone('utc'::text, now());
      ELSIF OLD.status = 'published'::public.publication_status THEN
        -- Preserve original published_at when edited while published (unless explicitly set)
        NEW.published_at := COALESCE(OLD.published_at, NEW.published_at, timezone('utc'::text, now()));
      END IF;
    END IF;
  ELSIF NEW.status IN ('draft'::public.publication_status, 'in_review'::public.publication_status) THEN
    -- When reverting an article from published to draft or review, clear publication date
    IF TG_OP = 'UPDATE' AND OLD.status = 'published'::public.publication_status THEN
      NEW.published_at := NULL;
    ELSIF TG_OP = 'INSERT' THEN
      NEW.published_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_publication_published_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_role_to_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{user_role}',
    to_jsonb(NEW.role::text)
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_user_role_to_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_publication_published_newsletter"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.newsletter_sent_at IS DISTINCT FROM OLD.newsletter_sent_at THEN
      -- Observe claims even if the handler releases them before pg_net responds.
      -- Retained claims (including partial email success) are never retried.
      IF NEW.newsletter_sent_at IS NULL THEN
        -- Also handle a claim made by a webhook already in flight at migration time.
        INSERT INTO public.newsletter_dispatches (publication_id) VALUES (NEW.id)
        ON CONFLICT (publication_id) DO NOTHING;
      END IF;
      UPDATE public.newsletter_dispatches
      SET status = CASE WHEN NEW.newsletter_sent_at IS NOT NULL THEN 'claimed'
                        WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
          next_attempt_at = CASE WHEN NEW.newsletter_sent_at IS NOT NULL OR attempts >= 5 THEN NULL
                                ELSE now() + interval '1 minute' * power(2, greatest(attempts - 1, 0)) END
      WHERE publication_id = NEW.id;
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM 'published' OR NEW.newsletter_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.newsletter_dispatches (publication_id) VALUES (NEW.id)
  ON CONFLICT (publication_id) DO NOTHING;
  IF FOUND THEN
    PERFORM public.dispatch_newsletter_webhook(NEW);
  END IF;
  -- Ordinary edits and republishing cannot reset the retry budget or backoff.
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_publication_published_newsletter"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unsubscribe_newsletter_by_email"("target_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: service_role required';
  END IF;

  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(TRIM(target_email)) 
  LIMIT 1;

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


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "publication_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_dispatches" (
    "publication_id" "uuid" NOT NULL,
    "request_id" bigint,
    "attempts" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "next_attempt_at" timestamp with time zone DEFAULT "now"(),
    "last_status_code" integer,
    CONSTRAINT "newsletter_dispatches_attempts_check" CHECK ((("attempts" >= 0) AND ("attempts" <= 5))),
    CONSTRAINT "newsletter_dispatches_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'dispatched'::"text", 'claimed'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."newsletter_dispatches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publication_tags" (
    "publication_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."publication_tags" OWNER TO "postgres";


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
    "newsletter_subscribed" boolean DEFAULT false,
    "role" "public"."user_role" DEFAULT 'reader'::"public"."user_role",
    "slug" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_publication_key" UNIQUE ("author_id", "publication_id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_dispatches"
    ADD CONSTRAINT "newsletter_dispatches_pkey" PRIMARY KEY ("publication_id");



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



CREATE INDEX "idx_publications_status_published_at" ON "public"."publications" USING "btree" ("status", "published_at" DESC NULLS LAST, "created_at" DESC);



CREATE INDEX "newsletter_dispatches_due_idx" ON "public"."newsletter_dispatches" USING "btree" ("next_attempt_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'dispatched'::"text"]));



CREATE OR REPLACE TRIGGER "before_insert_publication_quota" BEFORE INSERT ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."check_publication_quotas"();



CREATE OR REPLACE TRIGGER "on_publication_published_newsletter" AFTER INSERT OR UPDATE ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_publication_published_newsletter"();



CREATE OR REPLACE TRIGGER "on_user_role_changed" AFTER INSERT OR UPDATE OF "role" ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_role_to_auth"();



CREATE OR REPLACE TRIGGER "set_publication_published_at_trigger" BEFORE INSERT OR UPDATE ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."set_publication_published_at"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_publications_updated_at" BEFORE UPDATE ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."newsletter_dispatches"
    ADD CONSTRAINT "newsletter_dispatches_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE;



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



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "author_id") AND (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "comments"."publication_id") AND ("p"."status" = 'published'::"public"."publication_status"))))));



CREATE POLICY "Authors and Admins can delete publications" ON "public"."publications" FOR DELETE TO "authenticated" USING (("public"."is_operator"() OR (("auth"."uid"() = "author_id") AND ("status" <> 'published'::"public"."publication_status") AND "public"."is_writer"())));



CREATE POLICY "Authors and Operators can delete publication tags" ON "public"."publication_tags" FOR DELETE TO "authenticated" USING (("public"."is_operator"() OR ("public"."is_writer"() AND (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "publication_tags"."publication_id") AND ("p"."author_id" = "auth"."uid"()) AND ("p"."status" <> 'published'::"public"."publication_status")))))));



CREATE POLICY "Authors and Operators can insert publication tags" ON "public"."publication_tags" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_operator"() OR ("public"."is_writer"() AND (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "publication_tags"."publication_id") AND ("p"."author_id" = "auth"."uid"()) AND ("p"."status" <> 'published'::"public"."publication_status")))))));



CREATE POLICY "Authors and Operators can update publication tags" ON "public"."publication_tags" FOR UPDATE TO "authenticated" USING (("public"."is_operator"() OR ("public"."is_writer"() AND (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "publication_tags"."publication_id") AND ("p"."author_id" = "auth"."uid"()) AND ("p"."status" <> 'published'::"public"."publication_status"))))))) WITH CHECK (("public"."is_operator"() OR ("public"."is_writer"() AND (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "publication_tags"."publication_id") AND ("p"."author_id" = "auth"."uid"()) AND ("p"."status" <> 'published'::"public"."publication_status")))))));



CREATE POLICY "Authors can insert publications" ON "public"."publications" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "author_id") AND "public"."is_writer"() AND ("public"."is_operator"() OR (("status" <> 'published'::"public"."publication_status") AND ("is_pinned" = false)))));



CREATE POLICY "Authors can update own publications" ON "public"."publications" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "author_id") AND "public"."is_writer"() AND ("public"."is_operator"() OR ("status" <> 'published'::"public"."publication_status")))) WITH CHECK ((("auth"."uid"() = "author_id") AND "public"."is_writer"() AND ("public"."is_operator"() OR (("status" <> 'published'::"public"."publication_status") AND ("is_pinned" = false)))));



CREATE POLICY "Etiquetas visibles para todos" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Operators can delete tag translations" ON "public"."tag_translations" FOR DELETE TO "authenticated" USING ("public"."is_operator"());



CREATE POLICY "Operators can delete tags" ON "public"."tags" FOR DELETE TO "authenticated" USING ("public"."is_operator"());



CREATE POLICY "Operators can update any publication" ON "public"."publications" FOR UPDATE TO "authenticated" USING ("public"."is_operator"()) WITH CHECK ("public"."is_operator"());



CREATE POLICY "Operators can update tag translations" ON "public"."tag_translations" FOR UPDATE TO "authenticated" USING ("public"."is_operator"()) WITH CHECK ("public"."is_operator"());



CREATE POLICY "Operators can update tags" ON "public"."tags" FOR UPDATE TO "authenticated" USING ("public"."is_operator"()) WITH CHECK ("public"."is_operator"());



CREATE POLICY "Public read comments" ON "public"."comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "comments"."publication_id") AND (("p"."status" = 'published'::"public"."publication_status") OR ("p"."author_id" = "auth"."uid"()) OR "public"."is_operator"())))));



CREATE POLICY "Public read publication tags" ON "public"."publication_tags" FOR SELECT USING (true);



CREATE POLICY "Public read published publications" ON "public"."publications" FOR SELECT USING ((("status" = 'published'::"public"."publication_status") OR ("auth"."uid"() = "author_id")));



CREATE POLICY "Public read user profiles" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Reviewers can update in_review publications" ON "public"."publications" FOR UPDATE TO "authenticated" USING ((("status" = 'in_review'::"public"."publication_status") AND (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'user_role'::"text"), ( SELECT ("users"."role")::"text" AS "role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) = ANY (ARRAY['founder'::"text", 'admin'::"text"])))) WITH CHECK ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'user_role'::"text"), ( SELECT ("users"."role")::"text" AS "role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) = ANY (ARRAY['founder'::"text", 'admin'::"text"])));



CREATE POLICY "Reviewers can view reviewable publications" ON "public"."publications" FOR SELECT TO "authenticated" USING ((("status" = 'in_review'::"public"."publication_status") AND (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'user_role'::"text"), ( SELECT ("users"."role")::"text" AS "role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) = ANY (ARRAY['founder'::"text", 'admin'::"text"]))));



CREATE POLICY "Traducciones de etiquetas visibles para todos" ON "public"."tag_translations" FOR SELECT USING (true);



CREATE POLICY "Users and Operators can delete comments" ON "public"."comments" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "author_id") OR "public"."is_operator"()));



CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Writers and Operators can insert tag translations" ON "public"."tag_translations" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_writer"());



CREATE POLICY "Writers and Operators can insert tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_writer"());



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_dispatches" ENABLE ROW LEVEL SECURITY;


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



REVOKE ALL ON FUNCTION "public"."current_user_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."publications" TO "service_role";
GRANT SELECT ON TABLE "public"."publications" TO "anon";
GRANT SELECT,DELETE ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("id") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("slug"),UPDATE("slug") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("cover_image_url"),UPDATE("cover_image_url") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("status"),UPDATE("status") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("updated_at"),UPDATE("updated_at") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("author_id") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("is_pinned"),UPDATE("is_pinned") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("type"),UPDATE("type") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("original_language"),UPDATE("original_language") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("title"),UPDATE("title") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("subtitle"),UPDATE("subtitle") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("content"),UPDATE("content") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("published_at"),UPDATE("published_at") ON TABLE "public"."publications" TO "authenticated";



GRANT INSERT("show_index"),UPDATE("show_index") ON TABLE "public"."publications" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."dispatch_newsletter_webhook"("publication" "public"."publications") FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."generate_slug"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."is_operator"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_operator"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_operator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_operator"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_writer"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_writer"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_writer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_writer"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reconcile_newsletter_dispatches"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reconcile_newsletter_dispatches"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_publication_published_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_publication_published_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_publication_published_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_user_role_to_auth"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_user_role_to_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_publication_published_newsletter"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_publication_published_newsletter"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_publication_published_newsletter"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."unsubscribe_newsletter_by_email"("target_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."unsubscribe_newsletter_by_email"("target_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT SELECT ON TABLE "public"."newsletter_dispatches" TO "service_role";



GRANT ALL ON TABLE "public"."publication_tags" TO "anon";
GRANT ALL ON TABLE "public"."publication_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."publication_tags" TO "service_role";



GRANT ALL ON TABLE "public"."tag_translations" TO "anon";
GRANT ALL ON TABLE "public"."tag_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_translations" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT SELECT ON TABLE "public"."users" TO "supabase_auth_admin";
GRANT SELECT ON TABLE "public"."users" TO "authenticated";



GRANT SELECT("id") ON TABLE "public"."users" TO "anon";



GRANT UPDATE("full_name") ON TABLE "public"."users" TO "authenticated";
GRANT SELECT("full_name") ON TABLE "public"."users" TO "anon";



GRANT UPDATE("bio") ON TABLE "public"."users" TO "authenticated";
GRANT SELECT("bio") ON TABLE "public"."users" TO "anon";



GRANT UPDATE("avatar_url") ON TABLE "public"."users" TO "authenticated";
GRANT SELECT("avatar_url") ON TABLE "public"."users" TO "anon";



GRANT UPDATE("newsletter_subscribed") ON TABLE "public"."users" TO "authenticated";



GRANT SELECT("role") ON TABLE "public"."users" TO "anon";



GRANT SELECT("slug") ON TABLE "public"."users" TO "anon";









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































