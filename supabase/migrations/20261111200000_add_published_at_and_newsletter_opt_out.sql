-- ==============================================================================
-- Migration: Add published_at, handle draft revocation, default newsletter opt-out
-- 1. Adds published_at to public.publications
-- 2. Trigger set_publication_published_at:
--    - When status transitions to 'published': sets published_at to now() if NULL
--    - When status transitions from 'published' to 'draft' or 'in_review': clears published_at = NULL
--    - When an already published article is updated: preserves original published_at
-- 3. Backfill existing published publications:
--    - Recently published articles with drafts: use their real updated_at publication time
--    - Historical articles: use created_at to preserve original chronology
-- 4. Set newsletter_subscribed default to false on public.users and update handle_new_user()
-- 5. Add composite index on (status, published_at DESC NULLS LAST, created_at DESC)
-- ==============================================================================

BEGIN;

-- 1. Add published_at column to publications
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS published_at timestamptz NULL;

-- 2. Backfill existing publications
-- For historical published articles (created on or before 2026-10-24), set published_at = created_at
UPDATE public.publications
SET published_at = created_at
WHERE status = 'published'
  AND published_at IS NULL
  AND created_at <= '2026-10-24 23:59:59+00';

-- For recently published articles (created after 2026-10-24), use updated_at (their publication timestamp)
UPDATE public.publications
SET published_at = COALESCE(updated_at, created_at)
WHERE status = 'published'
  AND published_at IS NULL;

-- 3. Trigger to manage published_at automatically
CREATE OR REPLACE FUNCTION public.set_publication_published_at()
RETURNS trigger
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS "set_publication_published_at_trigger" ON public.publications;

CREATE TRIGGER "set_publication_published_at_trigger"
  BEFORE INSERT OR UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_publication_published_at();

-- 4. Index on (status, published_at DESC NULLS LAST, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_publications_status_published_at
  ON public.publications USING btree (status, published_at DESC NULLS LAST, created_at DESC);

-- 5. Default newsletter_subscribed to FALSE for new users
ALTER TABLE public.users
  ALTER COLUMN newsletter_subscribed SET DEFAULT false;

-- 6. Update handle_new_user trigger function to set newsletter_subscribed = FALSE by default
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
    FALSE
  );
  RETURN NEW;
END;
$$;

COMMIT;
