-- Migration: CodeRabbit PR #31 Security & RLS Hardening
-- Ensures all security fixes from CodeRabbit review are applied to remote databases.

-- 1. get_subscribers_emails RPC hardening: search_path, service_role authorization only
CREATE OR REPLACE FUNCTION "public"."get_subscribers_emails"("webhook_secret" "text") 
RETURNS TABLE("email" "text", "full_name" "text")
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: service_role required';
  END IF;

  RETURN QUERY
  SELECT u.email::text, u.full_name::text
  FROM public.users u
  WHERE u.newsletter_subscribed = true AND u.email IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION "public"."get_subscribers_emails"("text") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_subscribers_emails"("text") TO "service_role";

-- 2. unsubscribe_newsletter_by_email RPC hardening: search_path, service_role authorization only
CREATE OR REPLACE FUNCTION "public"."unsubscribe_newsletter_by_email"("target_email" "text") 
RETURNS boolean
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: service_role required';
  END IF;

  UPDATE public.users
  SET newsletter_subscribed = false
  WHERE email = target_email AND newsletter_subscribed = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION "public"."unsubscribe_newsletter_by_email"("text") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."unsubscribe_newsletter_by_email"("text") TO "service_role";

-- 3. Dynamic trigger without hardcoded webhook secret
CREATE OR REPLACE FUNCTION "public"."trigger_publication_published_newsletter"() 
RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  app_url text;
  wh_secret text;
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    app_url := COALESCE(current_setting('app.settings.site_url', true), 'https://cernapensamento.org');
    wh_secret := current_setting('app.settings.webhook_secret', true);
    
    PERFORM net.http_post(
      url := app_url || '/api/webhooks/newsletter',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(wh_secret, '')
      ),
      body := jsonb_build_object(
        'publication_id', NEW.id,
        'title', NEW.title,
        'slug', NEW.slug
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Publication policies: author publication gating and reviewer policies
DROP POLICY IF EXISTS "Authors can insert publications" ON "public"."publications";
CREATE POLICY "Authors can insert publications" ON "public"."publications"
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = author_id) AND
    (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['guest'::text, 'member'::text, 'founder'::text, 'admin'::text])) AND
    (
      COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['founder'::text, 'admin'::text])
      OR (status <> 'published'::public.publication_status AND is_pinned = false)
    )
  );

DROP POLICY IF EXISTS "Authors can update own publications" ON "public"."publications";
CREATE POLICY "Authors can update own publications" ON "public"."publications"
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (
    (auth.uid() = author_id) AND
    (
      COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['founder'::text, 'admin'::text])
      OR (status <> 'published'::public.publication_status AND is_pinned = false)
    )
  );

DROP POLICY IF EXISTS "Reviewers can view reviewable publications" ON "public"."publications";
CREATE POLICY "Reviewers can view reviewable publications" ON "public"."publications"
  FOR SELECT TO authenticated
  USING (
    status = 'in_review'::public.publication_status AND
    COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['founder'::text, 'admin'::text])
  );

DROP POLICY IF EXISTS "Reviewers can update in_review publications" ON "public"."publications";
CREATE POLICY "Reviewers can update in_review publications" ON "public"."publications"
  FOR UPDATE TO authenticated
  USING (
    status = 'in_review'::public.publication_status AND
    COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['founder'::text, 'admin'::text])
  )
  WITH CHECK (
    COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['founder'::text, 'admin'::text])
  );

-- 5. Tags and tag_translations management restricted to editorial roles
DROP POLICY IF EXISTS "Editores pueden crear tags" ON "public"."tags";
DROP POLICY IF EXISTS "Editors can manage tags" ON "public"."tags";
CREATE POLICY "Editors can manage tags" ON "public"."tags"
  FOR ALL TO authenticated
  USING (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['founder'::text, 'admin'::text, 'member'::text]))
  WITH CHECK (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['founder'::text, 'admin'::text, 'member'::text]));

DROP POLICY IF EXISTS "Editores pueden traducir tags" ON "public"."tag_translations";
DROP POLICY IF EXISTS "Editors can manage tag translations" ON "public"."tag_translations";
CREATE POLICY "Editors can manage tag translations" ON "public"."tag_translations"
  FOR ALL TO authenticated
  USING (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['founder'::text, 'admin'::text, 'member'::text]))
  WITH CHECK (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), (SELECT (users.role)::text FROM public.users WHERE (users.id = auth.uid()))) = ANY (ARRAY['founder'::text, 'admin'::text, 'member'::text]));

-- 6. Column-level permissions on public.users to prevent self-elevation of role
REVOKE ALL ON TABLE "public"."users" FROM "anon", "authenticated";
GRANT SELECT ON TABLE "public"."users" TO "anon";
GRANT SELECT ON TABLE "public"."users" TO "authenticated";
GRANT UPDATE ("full_name", "bio", "avatar_url", "newsletter_subscribed") ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT SELECT ON TABLE "public"."users" TO "supabase_auth_admin";
