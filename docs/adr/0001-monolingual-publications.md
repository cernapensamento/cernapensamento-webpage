---
status: accepted
---

# Monolingual publications via JSONB key presence and in-place cross-locale fallback

Cerna Pensamento previously enforced strict bilingualism (`gl` and `es`) at the database level via PostgreSQL `CHECK` constraints on `publications`. To allow writers across all roles and publication types to publish **Monolingual Publications** (either `gl`-only or `es`-only) alongside **Bilingual Publications**, we made two architectural decisions:

1. **Derive language availability from stored JSONB keys rather than adding a `language_mode` column.** A publication's available languages are the non-empty locale keys present in `title` and `content`, with `original_language` constrained to one of those available languages. The Author Desk editor presents an explicit Bilingual / Monolingual toggle (defaulting to Bilingual for new publications), keeps inactive tab edits in memory during the session, and strips the unused language on save (with confirmation if removing a previously saved translation). Database `CHECK` constraints require at least one valid language (`original_language` present with non-empty title and content on `published` / `in_review`, and at least one non-empty title or content on `draft`), eliminating fake `"Sen Título"` / `"Sin Título"` placeholders in stored JSONB.
2. **Keep a unified public catalog with in-place fallback and canonical SEO.** Monolingual Publications remain visible across both `/gl` and `/es` listings (displaying a subtle language badge only when browsing the alternate locale). Visiting a Monolingual Publication at the alternate locale's URL renders the text in place in its original language with an explicit availability notice, sets the article body's HTML `lang` attribute to the publication's language, and emits `<link rel="canonical">` pointing to `/${original_language}/articulo/${slug}`. Meanwhile, `sitemap.ts` emits only the available locale URL(s) for Monolingual Publications to avoid duplicate-content `hreflang` signals.

## Considered Options

- **Dedicated `language_mode` / `published_languages` DB column:** Rejected because it duplicates state already carried by the JSONB maps, risks exposing hidden/stale draft text in search or leaving orphaned inline storage images, and requires extra plumbing across listings and sitemaps.
- **Redirecting or returning `404` on the alternate locale URL:** Rejected because Cerna's readership is bilingual Galician/Spanish; redirects forcibly switch the reader's site UI language, and `404`s break shared links and the site's `GL ↔ ES` toggle.
- **Hiding Monolingual Publications from the alternate locale's listings:** Rejected because readers browsing in Spanish or Galician would silently miss half-catalog content.

## Consequences

- Public cards, mosaics, author profiles, Author Desk rows, and `sitemap.ts` can determine Bilingual vs. Monolingual availability directly from `title` (already selected in card queries) without violating the egress guardrail against selecting full `content` on listings.
- Saving an unfinished Bilingual draft with only one language populated reopens in Monolingual mode; flipping the toggle back to Bilingual restores the second tab when ready.
- Switching an existing Bilingual Publication down to Monolingual permanently deletes the removed language on save and purges inline storage images unique to that language, requiring explicit user confirmation beforehand.
