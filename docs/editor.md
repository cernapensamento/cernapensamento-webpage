# Editorial Suite, Rendering Pipeline & PDF Export

Cerna Pensamento pairs a customized **TipTap 3 (`3.27.x`)** WYSIWYG writing environment in `/escritorio` with a deterministic, XSS-safe server rendering pipeline and a programmatic PDF generator.

---

## 1. TipTap 3 Editor & Custom Extensions (`src/lib/editor/`)

Configured inside `src/components/escritorio/ArticleEditor.tsx` and persisted locally via `src/lib/editor/draftStorage.ts`:

| Module | Capability & Behavior |
| :--- | :--- |
| **`MathExtensions.ts`** | Adds inline (`$...$`) and block (`$$...$$`) LaTeX math nodes inside ProseMirror with live KaTeX (`0.16.x`) preview inside the editor. |
| **`TableExtensions.ts`** | Configures structured academic tables paired with contextual row/column/header actions in `src/components/escritorio/TableControls.tsx`. |
| **`FigureExtension.ts`** | Custom `<figure>` + `<figcaption>` image node integrating with `uploadStorageImage()` (`src/lib/storage/`) to compress uploads client-side to WebP (`max 1400x1400`) under `publications/inline/{userId}/`. |
| **`FontSizeExtension.ts`** | Extends `TextStyle` to allow controlled editorial typography sizing overrides inside bodies and pull quotes. |
| **`ArticleIndexExtension.ts`** | Legacy inline `<nav data-type="article-index">` TipTap node preserved for editor/document backward compatibility; new publications control TOC visibility cleanly through the boolean `publications.show_index` flag. |

### Companion Editorial Controls (`src/components/escritorio/`, `src/components/forms/`)
- **`EditarArticuloForm.tsx`:** Manages dual-language fields (`title`, `subtitle`, `content` across `gl` and `es`), original language selector, `type` (`article`, `essay`, `poetry`, `narrative`, `news`), `show_index` toggle, cover image WebP uploader (`max 1600x1200`), and invokes `/api/translate` (`gemini-3.5-flash-lite`) to translate between Galician and Spanish.
- **`TagManager.tsx`:** Attaches and creates bilingual taxonomy tags (`tags`, `tag_translations`, `publication_tags`).
- **`ReviewActionBar.tsx`:** Renders on the client inside `/articulo/[slug]` for `founder` and `admin` roles to approve, reject, or inspect editorial submissions without breaking ISR on the page route.
- **`PinArticleButton.tsx` / `DeleteArticleButton.tsx`:** Dashboard controls enforcing `cleanupPublicationImages()` on deletion so storage objects do not orphan.

---

## 2. Deterministic Rendering & Sanitization Pipeline

When serving a publication in `src/app/[lang]/articulo/[slug]/page.tsx`, raw TipTap HTML passes through a strict four-stage server pipeline before hitting React `dangerouslySetInnerHTML`:

```text
  stored HTML (publication.content[lang])
       │
       ▼
  1. stripIndex(...)            ──► src/lib/editor/generateIndex.ts
       │                            Removes legacy inline <nav data-type="article-index"> blocks
       ▼
  2. renderMathInHtml(...)      ──► src/lib/editor/renderMath.ts
       │                            Compiles LaTeX expressions into KaTeX MathML/HTML markup
       ▼
  3. renderHeadingAnchors(...)  ──► src/lib/editor/renderHeadingAnchors.ts
       │                            Assigns stable slug `id` attributes to h2/h3 headings
       ▼
  4. sanitizeArticleHtml(...)   ──► src/lib/editor/sanitizeArticleHtml.ts
       │                            Applies strict `ARTICLE_SANITIZER_CONFIG` allowlist (`sanitize-html`)
       ▼
  Rendered article body + declarative <ArticleTableOfContents /> (when show_index = true)
```

### Critical Invariant: Centralized Sanitizer Whitelist
All sanitization rules live in `ARTICLE_SANITIZER_CONFIG` inside `src/lib/editor/sanitizeArticleHtml.ts`. Any new TipTap node, inline class, style property, SVG/MathML attribute, or `<figure>`/`<table>`/`<a>` attribute emitted by an extension **must** be explicitly whitelisted in `ARTICLE_SANITIZER_CONFIG` (with unit coverage in `sanitizeArticleHtml.test.ts`); otherwise `sanitizeArticleHtml()` strips it cleanly at runtime.

### Table of Contents & Scroll Tracking
- When `publication.show_index` is enabled, `src/app/[lang]/articulo/[slug]/page.tsx` extracts headings via `getHeadingsFromHtml()` (`src/lib/editor/generateIndex.ts`) and renders `<ArticleTableOfContents />` alongside `<ArticleScrollManager />` for smooth anchor navigation and active section highlighting.
- During saves in `src/actions/articles.ts` (`saveArticleAction`), `stripIndex()` is also applied in `buildContentPayload` so saved records remain cleanly decoupled from legacy inline TOC markup.

---

## 3. Server-Side PDF Export (`pdf-lib`)

- **Generator:** `src/lib/pdf/articlePdf.ts` (`buildArticlePdf`) uses `pdf-lib` (`^1.17.1`) to typeset publication title, subtitle, author attribution, publication date, and sanitized article body into a downloadable editorial PDF.
- **Endpoint:** `GET /api/articulo/[slug]/pdf?lang=gl|es` (`src/app/api/articulo/[slug]/pdf/route.ts`) runs on the `nodejs` runtime (`ArticleDownload.tsx` trigger).
- **CDN Caching:** Responses return `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`, ensuring repeated reader downloads are served from edge caches without hitting origin compute or PostgreSQL repeatedly.
