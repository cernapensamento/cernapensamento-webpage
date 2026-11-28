---
status: accepted
---

# Unified WebP media storage with entity-grouped paths and hybrid upload pipeline

Cerna Pensamento previously split uploaded imagery across two Supabase Storage buckets (`media` and legacy `imagenes-articulos`), mixed Spanish/English uploader-scoped folders (`profiles/`, `publications/covers/`, `publications/inline/`, `avatares/`, `portadas/`, `contenido/`), and allowed JPEG/PNG fallbacks alongside WebP. To consolidate all uploaded storage assets into one clean, WebP-only bucket without breaking existing publications, we made three architectural decisions:

1. **Single `media` bucket, WebP-only, organized by immutable entity UUID.** Retire `imagenes-articulos` and keep `media` as the sole uploaded-media bucket, locked to `allowed_mime_types = ['image/webp']` (static UI/brand files stay in `public/images/`). Canonical paths group assets by immutable entity ID with cache-busting filenames (`Cache-Control: immutable`):
   - `users/{userId}/avatar-{timestamp}-{slug}.webp`
   - `publications/{publicationId}/cover-{timestamp}-{slug}.webp`
   - `publications/{publicationId}/inline/{name}-{timestamp}-{slug}.webp`
   - `_orphans/{sourceBucket}/{originalPath}.webp` (temporary root folder for unreferenced legacy objects pending manual review; write/delete restricted to operators and `service_role`).
2. **Lazy draft creation on `/escritorio/nuevo` and Server Action folder sweep on delete.** Because `publications/{publicationId}/...` requires an existing publication row for DB-backed Storage RLS (`publications.author_id = auth.uid()` or operator, preserving the audit rule blocking non-operators from modifying/deleting assets of `published` articles), the first image upload in `/escritorio/nuevo` lazily creates a minimal `draft` row, binds its `id`, and updates the browser URL via `history.replaceState` to `/${lang}/escritorio/editar/${slug}` (enforcing Guest Author quotas before upload). Publication deletion moves into `deleteArticleAction`, which deletes the DB row using the user's authenticated client first (preserving DB RLS) and then sweeps the entire `publications/{publicationId}/` folder server-side so non-operator authors are not blocked by missing row ownership after deletion.
3. **Hybrid client pre-resize into a server-side `sharp` WebP upload endpoint (`POST /api/storage/upload`).** Safari/iOS WebKit cannot encode `image/webp` via `<canvas>`, while Vercel Hobby enforces a 4.5 MB request body ceiling. To guarantee 100% WebP across all browsers without HTTP 413 errors, the browser pre-resizes/compresses only when a file exceeds ~3.5 MB or the category's max dimensions (WebP where supported, high-quality JPEG fallback on Safari/iOS). The authenticated API route inspects payloads with `sharp(buffer).metadata()`, passes already-valid in-bounds WebP bytes straight through (preventing double lossy compression), converts all other inputs to WebP via `sharp`, and uploads via the user's authenticated Supabase SSR client so Storage RLS remains enforced in depth. `/api/storage/upload` uses the 30 req/min mutation rate limit rather than the 10 req/min generic `/api/*` cap.

## Considered Options

- **Keep uploader-scoped paths (`publications/covers/{userId}/...`):** Rejected because covers and inline images from all of an author's articles mix in flat folders, and operator edits land under the operator's `userId` rather than the publication.
- **Client-generated publication UUID with permissive Storage `INSERT` RLS:** Rejected because abandoned `/escritorio/nuevo` tabs would leave unowned orphan files under `publications/{uuid}/...` with no backing DB row.
- **Pure client-side uploads or pure server-side uploads without client pre-resize:** Pure client-side uploads break Safari/iOS once `media` enforces `image/webp` only; pure server-side uploads hit Vercel Hobby's 4.5 MB body limit on large raw photos or PNGs.
- **Byte-for-byte migration with a 30-day legacy bucket grace period:** Rejected because all bucket assets should be uniform WebP (converting non-WebP files without upscaling while keeping already-WebP bytes untouched) and only two test newsletters had been sent, making a two-phase idempotent CLI (`migrate --dry-run` + verification → immediate `cleanup`) safe without a 30-day dual-bucket window.

## Consequences

- Migration rewrites `users.avatar_url`, `publications.cover_image_url`, and inline `<img>` URLs in `publications.content` (`gl`/`es`) — normalizing legacy host URLs (`pzupxjsprmuudmvhzpxu.supabase.co`), leaving external URLs (e.g. Google OAuth avatars) untouched, duplicating any storage image shared across two distinct publications into each publication's folder, and failing fast if a DB reference points to a missing object.
- Once production migration is verified and `imagenes-articulos` is deleted, legacy compatibility code (`LEGACY_STORAGE_BUCKETS`, `LEGACY_STORAGE_FOLDERS`, `LEGACY_STORAGE_HOST`, `sanitizeStorageUrl`) and legacy RLS branches are removed, and local `supabase/seed.sql` + `supabase/buckets/media/` align to the entity-grouped layout.
- Any Guest Author uploading an image on `/escritorio/nuevo` consumes a draft slot immediately upon lazy draft creation (and frees it if they delete the draft), ensuring quota enforcement precedes storage writes.
