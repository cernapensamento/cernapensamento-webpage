-- Migration: Generalize publication original_language check constraint
-- Allows Cerna to support dynamic locales beyond 'gl' and 'es' without schema lock-in.

ALTER TABLE "public"."publications" DROP CONSTRAINT IF EXISTS "publications_original_language_check";

-- Enforce valid ISO language code format (at least 2 letters, lower-case identifier, e.g. 'gl', 'es', 'pt', 'en')
ALTER TABLE "public"."publications"
  ADD CONSTRAINT "publications_original_language_format_check"
  CHECK ("original_language" ~ '^[a-z]{2,5}(-[a-zA-Z0-9]{2,5})?$');
