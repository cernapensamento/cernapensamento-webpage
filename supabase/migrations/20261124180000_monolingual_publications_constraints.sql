-- Replace strict bilingual CHECK constraints on public.publications with
-- mode-aware constraints supporting Monolingual Publications (gl-only or es-only),
-- Bilingual Publications (gl and es), and permissive single-language drafts.

ALTER TABLE public.publications
  DROP CONSTRAINT IF EXISTS publications_title_bilingual_check,
  DROP CONSTRAINT IF EXISTS publications_subtitle_bilingual_check,
  DROP CONSTRAINT IF EXISTS publications_content_bilingual_check;

-- Legacy non-drafts used bilingual content and defaulted to Galician.
UPDATE public.publications
SET original_language = DEFAULT
WHERE status IS DISTINCT FROM 'draft' AND original_language IS NULL;

ALTER TABLE public.publications
  ADD CONSTRAINT publications_subtitle_jsonb_object_check CHECK (
    subtitle IS NULL OR jsonb_typeof(subtitle) = 'object'
  ),
  ADD CONSTRAINT publications_language_content_check CHECK (
    jsonb_typeof(title) = 'object'
    AND jsonb_typeof(content) = 'object'
    AND (
      CASE
        WHEN status = 'draft' THEN (
          length(btrim(coalesce(title ->> 'gl', ''))) > 0
          OR length(btrim(coalesce(title ->> 'es', ''))) > 0
          OR length(btrim(coalesce(content ->> 'gl', ''))) > 0
          OR length(btrim(coalesce(content ->> 'es', ''))) > 0
        )
        ELSE (
          original_language IS NOT NULL
          AND original_language IN ('gl', 'es')
          AND length(btrim(coalesce(title ->> original_language, ''))) > 0
          AND length(btrim(coalesce(content ->> original_language, ''))) > 0
          AND (
            (length(btrim(coalesce(title ->> 'gl', ''))) > 0)
            = (length(btrim(coalesce(content ->> 'gl', ''))) > 0)
          )
          AND (
            (length(btrim(coalesce(title ->> 'es', ''))) > 0)
            = (length(btrim(coalesce(content ->> 'es', ''))) > 0)
          )
        )
      END
    )
  );
