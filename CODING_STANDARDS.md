# Coding Standards — Cerna Pensamento

Review-time standards enforced by `/code-review` (Standards axis) alongside deterministic checks (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`). Documented rules here override baseline heuristics.

## Next.js 16 & React 19

- **Await async request APIs:** Always `await params`, `await searchParams`, `await cookies()`, and `await headers()` in App Router pages, layouts, Route Handlers, and `generateMetadata`.
- **Server Components by default:** Keep components as Server Components unless state, effects, event handlers, or browser APIs require `'use client'`.
- **Keep public reader SSR cacheable:** Public publication reader pages (`src/app/[lang]/articulo/[slug]/`) avoid calling `getAuthenticatedUser()` or `cookies()` during initial server render so ISR (`revalidate = 60`) stays intact; handle user-specific review actions on the client.

## Internationalization (i18n) & Publications

- **Dictionary-driven UI strings:** Retrieve all user-facing UI text, labels, badges, placeholders, and error messages from `src/dictionaries/gl.json` and `src/dictionaries/es.json` with strict key parity across both files.
- **Locale-prefixed internal URLs:** Prefix every internal `<Link href>`, `redirect`, and `router.push` with the active locale (`/${lang}/...`); use `i18n.defaultLocale` instead of hardcoded `'gl'` literals when falling back.
- **Monolingual & Bilingual Publications (see `docs/adr/0001-monolingual-publications.md`):**
  - Derive language availability from stored JSONB keys (`@/lib/i18n/publicationLanguage`) rather than adding separate mode columns.
  - Resolve localized publication fields using `publication.original_language` before falling back to `i18n.defaultLocale`.
  - Never write placeholder titles (`"Sen Título"` / `"Sin Título"`) into the database for empty locales or untitled drafts; render untitled fallbacks only in the UI.
  - Keep canonical URLs consistent across the HTML reader (`alternates.canonical`), XML sitemap, and Markdown API (`canonicalUrl`), all pointing to the resolved `actualLocale`.
  - Respect domain vocabulary from `GLOSSARY.md` (`Monolingual Publication`, `Bilingual Publication`, `Editorial Board`, `Guest Author`, `Tag`).

## Data Access Layer (DAL) & Storage

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:3e740081f0d05d15df3f78aab9d2b74e712962890bc0d362165da934e9d1306e -->

- **Zero magic strings:** Import table names, columns, statuses, types, roles, and actions from `@/lib/db/schema` (`DB_TABLES`, `PUBLICATION_COLS`, `USER_COLS`, `COMMENT_COLS`, `TAG_COLS`, `PUBLICATION_TAG_COLS`, `USER_ROLES`, `PUBLICATION_STATUSES`, `PUBLICATION_TYPES`, `EDITOR_ACTIONS`, `GUEST_PUBLICATION_LIMITS`).
- **Listing egress guardrail:** Homepage, archive, news, author profile, authors directory, sitemap, and Author Desk listing queries select only card metadata (including `title` and `original_language`) and never select full `content`.
- **Editorial role boundaries:** Only `founder` and `admin` publish directly (`published`) or approve/reject submissions in review; `member` and `guest` submit to `in_review`; `reader` is read-only.
- **WebP compression, entity-grouped paths & orphan cleanup (see `docs/adr/0002-unified-webp-media-storage.md`):** Route image uploads through `uploadStorageImage()` (`POST /api/storage/upload`, bucket `media`, entity-grouped paths under `users/{userId}/` and `publications/{publicationId}/`). Use `deleteArticleAction` (`sweepPublicationStorageFolder`) for full publication deletion. When removing a translation, delete only its inline images that no remaining locale references and preserve the cover.
- **Privileged storage cleanup ownership:** Validate entity ownership of any URL or path read from the database before deleting storage objects with `service_role`.
- **Paginated reads & bounded storage deletes:** Paginate unbounded Supabase `.select()` and `.storage.list()` scans, and batch `.storage.remove()` calls in chunks of at most 1,000 objects.

<!-- /coderabbit-ai-generated:v1 -->

## TipTap Editor & HTML Sanitization

- **Strict reader rendering pipeline:** Process publication body HTML in order: `stripIndex` → `renderMathInHtml` → `renderHeadingAnchors` → `sanitizeArticleHtml`.
- **Whitelist custom editor markup:** Explicitly allow every custom TipTap node, attribute, or inline style (`<figure>`, `<table>`, KaTeX elements, etc.) in `ARTICLE_SANITIZER_CONFIG` (`src/lib/editor/sanitizeArticleHtml.ts`).

## UI Composition & Editorial Design Tokens

- **Extract shared UI primitives:** When identical badge, pill, button, or card-decoration markup is needed in 2+ views, extract a shared component under `src/components/ui/` instead of duplicating inline spans.
- **Semantic Tailwind v4 tokens:** Use `bg-parchment`, `bg-surface`, `text-charcoal`, `text-charcoal/60`, `text-gold`, `border-lines`, `font-serif`, and `font-sans` so light and dark modes stay consistent.
