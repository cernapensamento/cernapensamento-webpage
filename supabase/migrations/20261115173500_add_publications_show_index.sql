-- Add declarative show_index flag to public.publications (default false)
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS show_index boolean NOT NULL DEFAULT false;

-- Backfill legacy publications containing embedded <nav data-type="article-index"> blocks
UPDATE public.publications
SET show_index = true
WHERE COALESCE(content->>'gl', '') ~* 'data-type="article-index"'
   OR COALESCE(content->>'es', '') ~* 'data-type="article-index"';
