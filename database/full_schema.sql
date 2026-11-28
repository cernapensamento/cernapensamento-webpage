


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


CREATE OR REPLACE FUNCTION "public"."check_publication_quotas"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_has_unlimited boolean;
  v_total_count int;
  v_year_count int;
BEGIN
  -- Always enforce server-authoritative timestamps on publication creation
  NEW.created_at := timezone('utc'::text, now());
  NEW.updated_at := timezone('utc'::text, now());

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = NEW.author_id
      AND rp.permission = 'publications:write_unlimited'
  ) INTO v_has_unlimited;

  IF NOT v_has_unlimited THEN
    SELECT count(*) INTO v_total_count
    FROM public.publications
    WHERE author_id = NEW.author_id;

    IF v_total_count >= 4 THEN
      RAISE EXCEPTION 'Límite total alcanzado: Un autor invitado no puede crear más de 4 publicaciones en total.';
    END IF;

    SELECT count(*) INTO v_year_count
    FROM public.publications
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
    ELSE (("original_language" IS NOT NULL) AND ("original_language" = ANY (ARRAY['gl'::"text", 'es'::"text"])) AND ("length"("btrim"(COALESCE(("title" ->> "original_language"), ''::"text"))) > 0) AND ("length"("btrim"(COALESCE(("content" ->> "original_language"), ''::"text"))) > 0) AND (("length"("btrim"(COALESCE(("title" ->> 'gl'::"text"), ''::"text"))) > 0) = ("length"("btrim"(COALESCE(("content" ->> 'gl'::"text"), ''::"text"))) > 0)) AND (("length"("btrim"(COALESCE(("title" ->> 'es'::"text"), ''::"text"))) > 0) = ("length"("btrim"(COALESCE(("content" ->> 'es'::"text"), ''::"text"))) > 0)))
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
  -- ECMAScript WhiteSpace and LineTerminator code points.
  v_trim_chars constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
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
    v_secret := btrim(current_setting('app.settings.webhook_secret', true), v_trim_chars);
    IF v_secret IS NULL OR v_secret = '' THEN
      SELECT btrim(decrypted_secret, v_trim_chars) INTO v_secret
      FROM vault.decrypted_secrets
      WHERE name IN ('webhook_secret', 'app.settings.webhook_secret')
      ORDER BY CASE WHEN name = 'webhook_secret' THEN 0 ELSE 1 END, updated_at DESC
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


CREATE OR REPLACE FUNCTION "public"."enforce_publication_pin_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_caller_role text := COALESCE(NULLIF(current_setting('role', true), 'none'), current_user);
  v_non_pin_changed boolean;
  v_can_edit_non_pin boolean;
BEGIN
  IF v_caller_role NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.is_pinned IS TRUE AND NOT public.has_permission('publications:pin') THEN
      RAISE EXCEPTION 'Insufficient privilege: publications:pin permission is required to pin a publication.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- TG_OP = 'UPDATE'
  IF NEW.is_pinned IS DISTINCT FROM OLD.is_pinned AND NOT public.has_permission('publications:pin') THEN
    RAISE EXCEPTION 'Insufficient privilege: publications:pin permission is required to change is_pinned.'
      USING ERRCODE = '42501';
  END IF;

  v_non_pin_changed := (
    NEW.id IS DISTINCT FROM OLD.id
    OR NEW.slug IS DISTINCT FROM OLD.slug
    OR NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.updated_at IS DISTINCT FROM OLD.updated_at
    OR NEW.author_id IS DISTINCT FROM OLD.author_id
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.original_language IS DISTINCT FROM OLD.original_language
    OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.subtitle IS DISTINCT FROM OLD.subtitle
    OR NEW.content IS DISTINCT FROM OLD.content
    OR NEW.newsletter_sent_at IS DISTINCT FROM OLD.newsletter_sent_at
    OR NEW.published_at IS DISTINCT FROM OLD.published_at
    OR NEW.show_index IS DISTINCT FROM OLD.show_index
  );

  IF v_non_pin_changed THEN
    v_can_edit_non_pin := (
      public.has_permission('publications:update_any')
      OR (
        OLD.author_id = auth.uid()
        AND OLD.status <> 'published'::public.publication_status
        AND public.has_permission('publications:update_own')
        AND (
          NEW.status <> 'published'::public.publication_status
          OR public.has_permission('publications:publish')
        )
      )
      OR (
        OLD.author_id = auth.uid()
        AND OLD.status = 'published'::public.publication_status
        AND public.has_permission('publications:publish')
      )
      OR (
        OLD.status = 'in_review'::public.publication_status
        AND public.has_permission('publications:review')
      )
    );

    IF NOT v_can_edit_non_pin THEN
      RAISE EXCEPTION 'Insufficient privilege: cannot modify non-pin fields on this publication.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_publication_pin_permission"() OWNER TO "postgres";


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
  INSERT INTO public.users (id, full_name, avatar_url, newsletter_subscribed)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'nombre',
      'UsuarioNuevo'
    ),
    NEW.raw_user_meta_data ->> 'avatar_url',
    FALSE
  );

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, 'reader')
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("required_permission" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND rp.permission = required_permission
  );
$$;


ALTER FUNCTION "public"."has_permission"("required_permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_public_role"("target_role_id" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = target_role_id
      AND r.is_public = true
  );
$$;


ALTER FUNCTION "public"."is_public_role"("target_role_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_removing_last_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF OLD.role_id = 'admin' AND (TG_OP = 'DELETE' OR NEW.role_id IS DISTINCT FROM 'admin') THEN
    PERFORM pg_advisory_xact_lock(hashtext('public.user_roles:last_admin'));

    IF NOT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE role_id = 'admin'
        AND user_id <> OLD.user_id
    ) THEN
      RAISE EXCEPTION 'Cannot remove the last remaining admin role assignment.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_removing_last_admin"() OWNER TO "postgres";


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
    IF TG_OP = 'INSERT' AND NEW.published_at IS NULL THEN
      NEW.published_at := timezone('utc'::text, now());
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.status IS DISTINCT FROM 'published'::public.publication_status THEN
        -- Always stamp real publication time when transitioning from draft/in_review to published
        NEW.published_at := timezone('utc'::text, now());
      ELSIF OLD.status = 'published'::public.publication_status THEN
        -- Preserve original published_at when edited while already published
        NEW.published_at := COALESCE(OLD.published_at, NEW.published_at, timezone('utc'::text, now()));
      END IF;
    END IF;
  ELSIF NEW.status IN ('draft'::public.publication_status, 'in_review'::public.publication_status) THEN
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


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "text" NOT NULL,
    "permission" "text" NOT NULL,
    CONSTRAINT "role_permissions_format_check" CHECK (("permission" ~ '^[a-z0-9_]+:[a-z0-9_]+$'::"text"))
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "text" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "public_priority" integer,
    CONSTRAINT "roles_id_format_check" CHECK (("id" ~ '^[a-z][a-z0-9_]*$'::"text")),
    CONSTRAINT "roles_public_priority_check" CHECK (((("is_public" = true) AND ("public_priority" IS NOT NULL) AND ("public_priority" > 0)) OR (("is_public" = false) AND ("public_priority" IS NULL))))
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "bio" "jsonb" DEFAULT '{}'::"jsonb",
    "avatar_url" "text",
    "newsletter_subscribed" boolean DEFAULT false,
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



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_public_priority_unique" UNIQUE ("public_priority");



ALTER TABLE ONLY "public"."tag_translations"
    ADD CONSTRAINT "tag_translations_pkey" PRIMARY KEY ("tag_id", "lang");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



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



CREATE INDEX "idx_user_roles_role_id" ON "public"."user_roles" USING "btree" ("role_id");



CREATE INDEX "newsletter_dispatches_due_idx" ON "public"."newsletter_dispatches" USING "btree" ("next_attempt_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'dispatched'::"text"]));



CREATE OR REPLACE TRIGGER "before_insert_publication_quota" BEFORE INSERT ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."check_publication_quotas"();



CREATE OR REPLACE TRIGGER "enforce_publication_pin_permission" BEFORE INSERT OR UPDATE ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_publication_pin_permission"();



CREATE OR REPLACE TRIGGER "on_publication_published_newsletter" AFTER INSERT OR UPDATE ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_publication_published_newsletter"();



CREATE OR REPLACE TRIGGER "prevent_removing_last_admin_trigger" BEFORE DELETE OR UPDATE OF "role_id" ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_removing_last_admin"();



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



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_translations"
    ADD CONSTRAINT "tag_translations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anonymous read public roles" ON "public"."roles" FOR SELECT TO "anon" USING (("is_public" = true));



CREATE POLICY "Anonymous read public user roles" ON "public"."user_roles" FOR SELECT TO "anon" USING ("public"."is_public_role"("role_id"));



CREATE POLICY "Authenticated read assigned or manageable role permissions" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role_id" = "role_permissions"."role_id")))) OR "public"."has_permission"('users:assign_role'::"text") OR "public"."has_permission"('users:revoke_role'::"text")));



CREATE POLICY "Authenticated read visible roles" ON "public"."roles" FOR SELECT TO "authenticated" USING ((("is_public" = true) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role_id" = "roles"."id")))) OR "public"."has_permission"('users:assign_role'::"text") OR "public"."has_permission"('users:revoke_role'::"text")));



CREATE POLICY "Authenticated read visible user roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_public_role"("role_id") OR "public"."has_permission"('users:assign_role'::"text") OR "public"."has_permission"('users:revoke_role'::"text")));



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "author_id") AND (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "comments"."publication_id") AND ("p"."status" = 'published'::"public"."publication_status"))))));



CREATE POLICY "Authors and Admins can delete publications" ON "public"."publications" FOR DELETE TO "authenticated" USING (("public"."has_permission"('publications:delete_any'::"text") OR (("auth"."uid"() = "author_id") AND ("status" <> 'published'::"public"."publication_status") AND "public"."has_permission"('publications:delete_own'::"text"))));



CREATE POLICY "Authors and Operators can delete publication tags" ON "public"."publication_tags" FOR DELETE TO "authenticated" USING (("public"."has_permission"('publications:update_any'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "publication_tags"."publication_id") AND ((("p"."author_id" = "auth"."uid"()) AND ("p"."status" <> 'published'::"public"."publication_status") AND "public"."has_permission"('publications:update_own'::"text")) OR (("p"."author_id" = "auth"."uid"()) AND ("p"."status" = 'published'::"public"."publication_status") AND "public"."has_permission"('publications:publish'::"text")) OR (("p"."status" = 'in_review'::"public"."publication_status") AND "public"."has_permission"('publications:review'::"text"))))))));



CREATE POLICY "Authors and Operators can insert publication tags" ON "public"."publication_tags" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_permission"('publications:update_any'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "publication_tags"."publication_id") AND ((("p"."author_id" = "auth"."uid"()) AND ("p"."status" <> 'published'::"public"."publication_status") AND "public"."has_permission"('publications:update_own'::"text")) OR (("p"."author_id" = "auth"."uid"()) AND ("p"."status" = 'published'::"public"."publication_status") AND "public"."has_permission"('publications:publish'::"text")) OR (("p"."status" = 'in_review'::"public"."publication_status") AND "public"."has_permission"('publications:review'::"text"))))))));



CREATE POLICY "Authors and Operators can update publication tags" ON "public"."publication_tags" FOR UPDATE TO "authenticated" USING (("public"."has_permission"('publications:update_any'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "publication_tags"."publication_id") AND ((("p"."author_id" = "auth"."uid"()) AND ("p"."status" <> 'published'::"public"."publication_status") AND "public"."has_permission"('publications:update_own'::"text")) OR (("p"."author_id" = "auth"."uid"()) AND ("p"."status" = 'published'::"public"."publication_status") AND "public"."has_permission"('publications:publish'::"text")) OR (("p"."status" = 'in_review'::"public"."publication_status") AND "public"."has_permission"('publications:review'::"text")))))))) WITH CHECK (("public"."has_permission"('publications:update_any'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "publication_tags"."publication_id") AND ((("p"."author_id" = "auth"."uid"()) AND ("p"."status" <> 'published'::"public"."publication_status") AND "public"."has_permission"('publications:update_own'::"text")) OR (("p"."author_id" = "auth"."uid"()) AND ("p"."status" = 'published'::"public"."publication_status") AND "public"."has_permission"('publications:publish'::"text")) OR (("p"."status" = 'in_review'::"public"."publication_status") AND "public"."has_permission"('publications:review'::"text"))))))));



CREATE POLICY "Authors can insert publications" ON "public"."publications" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "author_id") AND "public"."has_permission"('publications:create'::"text") AND (("status" <> 'published'::"public"."publication_status") OR "public"."has_permission"('publications:publish'::"text")) AND (("is_pinned" = false) OR "public"."has_permission"('publications:pin'::"text"))));



CREATE POLICY "Authors can update own unpublished publications" ON "public"."publications" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "author_id") AND ("status" <> 'published'::"public"."publication_status") AND "public"."has_permission"('publications:update_own'::"text"))) WITH CHECK ((("auth"."uid"() = "author_id") AND "public"."has_permission"('publications:update_own'::"text") AND (("status" <> 'published'::"public"."publication_status") OR "public"."has_permission"('publications:publish'::"text")) AND (("is_pinned" = false) OR "public"."has_permission"('publications:pin'::"text"))));



CREATE POLICY "Editors can update any publication" ON "public"."publications" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('publications:update_any'::"text")) WITH CHECK ("public"."has_permission"('publications:update_any'::"text"));



CREATE POLICY "Etiquetas visibles para todos" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Operators can delete tag translations" ON "public"."tag_translations" FOR DELETE TO "authenticated" USING ("public"."has_permission"('tags:delete'::"text"));



CREATE POLICY "Operators can delete tags" ON "public"."tags" FOR DELETE TO "authenticated" USING ("public"."has_permission"('tags:delete'::"text"));



CREATE POLICY "Operators can update tag translations" ON "public"."tag_translations" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('tags:update'::"text")) WITH CHECK ("public"."has_permission"('tags:update'::"text"));



CREATE POLICY "Operators can update tags" ON "public"."tags" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('tags:update'::"text")) WITH CHECK ("public"."has_permission"('tags:update'::"text"));



CREATE POLICY "Pinners can pin published publications" ON "public"."publications" FOR UPDATE TO "authenticated" USING ((("status" = 'published'::"public"."publication_status") AND "public"."has_permission"('publications:pin'::"text"))) WITH CHECK ((("status" = 'published'::"public"."publication_status") AND "public"."has_permission"('publications:pin'::"text")));



CREATE POLICY "Public and authorized read publications" ON "public"."publications" FOR SELECT USING ((("status" = 'published'::"public"."publication_status") OR ("auth"."uid"() = "author_id") OR (("status" = 'in_review'::"public"."publication_status") AND "public"."has_permission"('publications:review'::"text")) OR "public"."has_permission"('publications:update_any'::"text") OR "public"."has_permission"('publications:delete_any'::"text")));



CREATE POLICY "Public read comments" ON "public"."comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."publications" "p"
  WHERE (("p"."id" = "comments"."publication_id") AND (("p"."status" = 'published'::"public"."publication_status") OR ("p"."author_id" = "auth"."uid"()) OR (("p"."status" = 'in_review'::"public"."publication_status") AND "public"."has_permission"('publications:review'::"text")) OR "public"."has_permission"('publications:update_any'::"text") OR "public"."has_permission"('publications:delete_any'::"text"))))));



CREATE POLICY "Public read publication tags" ON "public"."publication_tags" FOR SELECT USING (true);



CREATE POLICY "Public read user profiles" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Publishers can update own published publications" ON "public"."publications" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "author_id") AND ("status" = 'published'::"public"."publication_status") AND "public"."has_permission"('publications:publish'::"text"))) WITH CHECK ((("auth"."uid"() = "author_id") AND "public"."has_permission"('publications:publish'::"text")));



CREATE POLICY "Reviewers can update in_review publications" ON "public"."publications" FOR UPDATE TO "authenticated" USING ((("status" = 'in_review'::"public"."publication_status") AND "public"."has_permission"('publications:review'::"text"))) WITH CHECK ("public"."has_permission"('publications:review'::"text"));



CREATE POLICY "Role managers can assign user roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_permission"('users:assign_role'::"text"));



CREATE POLICY "Role managers can revoke user roles" ON "public"."user_roles" FOR DELETE TO "authenticated" USING ("public"."has_permission"('users:revoke_role'::"text"));



CREATE POLICY "Traducciones de etiquetas visibles para todos" ON "public"."tag_translations" FOR SELECT USING (true);



CREATE POLICY "Users and Operators can delete comments" ON "public"."comments" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "author_id") OR "public"."has_permission"('comments:delete_any'::"text")));



CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Writers and Operators can insert tag translations" ON "public"."tag_translations" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_permission"('tags:create'::"text"));



CREATE POLICY "Writers and Operators can insert tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_permission"('tags:create'::"text"));



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_dispatches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publication_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


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



REVOKE ALL ON FUNCTION "public"."enforce_publication_pin_permission"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_publication_pin_permission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_slug"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."has_permission"("required_permission" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_permission"("required_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("required_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("required_permission" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_public_role"("target_role_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_public_role"("target_role_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_public_role"("target_role_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_public_role"("target_role_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."prevent_removing_last_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prevent_removing_last_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reconcile_newsletter_dispatches"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reconcile_newsletter_dispatches"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_publication_published_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_publication_published_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_publication_published_at"() TO "service_role";



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



GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";
GRANT SELECT ON TABLE "public"."role_permissions" TO "authenticated";



GRANT ALL ON TABLE "public"."roles" TO "service_role";
GRANT SELECT ON TABLE "public"."roles" TO "anon";
GRANT SELECT ON TABLE "public"."roles" TO "authenticated";



GRANT ALL ON TABLE "public"."tag_translations" TO "anon";
GRANT ALL ON TABLE "public"."tag_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_translations" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "service_role";
GRANT SELECT ON TABLE "public"."user_roles" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."user_roles" TO "authenticated";



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































