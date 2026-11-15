# Frontend Architecture & UI Layer

This document covers the Next.js 16 App Router tree under `src/app/[lang]/`, layout providers, design tokens, bilingual localization (`gl` / `es`), and component organization in `src/components/`.

---

## 1. Root & Localized Layout Architecture

All public and private pages live under `src/app/[lang]/`.

### `src/app/[lang]/layout.tsx`
- Validates `lang` against `i18n.locales` (`['gl', 'es']`), triggering `notFound()` on unsupported segments.
- Loads Google Fonts via `src/lib/fonts.ts` (`--font-libre-caslon`, `--font-source-sans`, `--font-plus-jakarta`) and attaches font CSS variables to `<html>`.
- Applies `<html lang={lang}>` and `suppressHydrationWarning` for flicker-free dark mode hydration.
- Wraps the subtree in a clean provider hierarchy:
  1. `ThemeProvider` (`src/components/ThemeProvider.tsx`) — class-based `light` / `dark` theme management.
  2. `FeedbackProvider` (`src/components/ui/FeedbackProvider.tsx`) — app-wide confirm/prompt dialogs and toasts.
  3. `AuthProvider` (`src/components/providers/AuthProvider.tsx`) — client-side Supabase auth state & role hydration.
  4. `HeaderVisibilityWrapper` → `PublicNavBar` (`src/components/layout/`).
  5. `<main>` — page content.
  6. `SiteFooter` (`src/components/layout/SiteFooter.tsx`, which wraps itself in `FooterVisibilityWrapper`).

> **Chrome Visibility Rules:** Both `HeaderVisibilityWrapper` and `FooterVisibilityWrapper` render navigation and footer chrome across public routes **and** `/escritorio`, hiding chrome only on dedicated password recovery screens (`/actualizar-password` and `/recuperar-password`).

### Authenticated Workspace Layout (`src/app/[lang]/escritorio/layout.tsx`)
- Enforces server-side session checks (`getAuthenticatedUser()`) before rendering the dashboard shell (`EscritorioShell`).
- Unauthenticated requests redirect to `/${lang}/login`; authenticated users with role `reader` are restricted away from writer desk routes (`nuevo`, `editar`) toward `/escritorio/perfil` (in coordination with edge gating in `src/proxy.ts`).

---

## 2. Complete Route Inventory

| Route (`/[lang]/...`) | Purpose | Rendering / Auth Strategy |
| :--- | :--- | :--- |
| `/` (`page.tsx`) | Editorial homepage: hero, intro, pinned articles, recent mosaic, association & news, columnists, themes, contact/FAQ + JSON-LD | Public SSR / ISR (`revalidate = 60`), metadata-only DB projection |
| `/articulos` | Searchable archive with tag and publication-type filters + load more pagination | Public SSR (`dynamic`) / client filter bar + `fetchMoreArticlesAction` |
| `/articulo/[slug]` | Full publication reader, KaTeX math, interactive TOC (`show_index`), PDF export link, comments, client review bar | Public ISR (`revalidate = 60`), zero server `cookies()`/`getAuthenticatedUser()` calls |
| `/noticias` | Editorial news mosaic listing (`NewsMosaicGrid`) | Public listing |
| `/autores` | Directory of contributors and editorial founders (`AuthorsDirectory`) | Public listing |
| `/autor/[slug]` | Individual author profile, bilingual bio, avatar, and published works (`AuthorProfileView`) | Public SSR |
| `/asociacion` | Institutional overview and manifesto | Public page (`asociacion/layout.tsx`) |
| `/asociacion/estatutos` | Association statutes (`EstatutosCard` + markdown in `src/content/estatutos/`) | Public static/SSR |
| `/asociacion/coleccion-*` | Dedicated collection charters (`coleccion-articulos`, `coleccion-ensayos`, `coleccion-narrativa`, `coleccion-poesia`) | Public collection pages via `EditorialCollectionPage` |
| `/contacto` *(alias `/contact`)* | Contact & article submission inquiry form (`ContactForm`) with PDF upload | Public page; posts to `/api/contact` |
| `/privacidad` *(alias `/privacy`)* | Bilingual privacy notice (`src/content/privacidad/`) | Public static/SSR |
| `/about` | Redirect/alias routed at edge (`src/proxy.ts` → `/asociacion`) or fallback page | Public redirect/page |
| `/login` | Sign-in / registration (Email + Password and Google OAuth 2.0) | Public auth entry; authenticated users redirect to `/escritorio` |
| `/recuperar-password` | Request password reset email | Public auth recovery (chrome hidden) |
| `/actualizar-password` | Set new password after recovery token confirmation (`PasswordForm`) | Authenticated recovery (chrome hidden) |
| `/escritorio` | Role-aware dashboard (drafts, in-review queue, published archive, pin/delete) | Protected Server + Client workspace |
| `/escritorio/nuevo` | Create new publication (`ArticleEditor` + metadata/bilingual sidebar) | Protected (`guest`, `member`, `founder`, `admin`) |
| `/escritorio/editar/[slug]` | Edit existing publication (`EditarArticuloForm` + `ArticleEditor`) | Protected (author or `founder`/`admin`) |
| `/escritorio/perfil` | User profile editor (bilingual bio, avatar WebP upload, newsletter subscription) | Protected (all authenticated roles) |
| `/bad-request`, `/unauthorized`, `/forbidden`, `/not-found`, `error.tsx` | Localized literary error screens rendered via `LiteraryError.tsx` | Error / HTTP status boundaries |

---

## 3. Design System & Typography

Configured in `src/app/globals.css` (Tailwind CSS v4 `@theme` + custom properties) and `src/lib/fonts.ts`:

| Semantic Token | Light Value | Dark Value (`.dark`) | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-parchment` (`bg-parchment`) | `#fbf9f8` | `#121212` | Primary paper-like page canvas |
| `--bg-surface` (`bg-surface`) | `#f5f3f3` | `#1a1a1a` | Elevated cards, drawers, editor surfaces, inputs |
| `--text-charcoal` (`text-charcoal`) | `#1a1a1a` | `#e4e2e2` | Primary editorial ink and headings |
| `--border-lines` (`border-lines`) | `#e4e2e2` | `#2a2a2a` | Hairline rules, table borders, section dividers |
| `--accent-gold` (`text-gold` / `bg-gold`) | `#c5a059` | `#c5a059` | Category eyebrow labels, active links, editorial accents |

### Font Families (`src/lib/fonts.ts`)
- **`font-serif` (`Libre Caslon Text`):** Display headlines, article titles, pull quotes, literary headings.
- **`font-sans` (`Source Sans 3`):** Body copy, navigation controls, dashboard UI, buttons.
- **`Plus Jakarta Sans` (`--font-plus-jakarta`):** Available auxiliary geometric sans variable loaded alongside the primary serif/sans pair.

---

## 4. Component Architecture (`src/components/`)

Components are partitioned strictly by domain responsibility:

- **`layout/`:** `PublicNavBar.tsx`, `SideMenu.tsx` (responsive drawer navigation), `SiteFooter.tsx`, `HeaderVisibilityWrapper.tsx`, `FooterVisibilityWrapper.tsx`.
- **`sections/`:** Modular homepage bands (`FeaturedArticleHero.tsx`, `HeroIntroSection.tsx`, `HeroAnimatedLogo.tsx`, `PinnedArticlesPanel.tsx`, `ArticlesMosaicSection.tsx` + skeleton/loader, `AssociationAndNewsSection.tsx`, `ColumnistsSection.tsx`, `ThemesSection.tsx`, `ContactSection.tsx`, `FAQSection.tsx`, `AboutUsSection.tsx`, plus `sectionArticleHelpers.ts`).
- **`features/`:** Reusable domain widgets (`ArticleCard.tsx`, `ArticleTableOfContents.tsx`, `ArticleScrollManager.tsx`, `ArticleDownload.tsx`, `ArticlesFilterBar.tsx`, `ArticlesArchiveList.tsx`, `CommentsSection.tsx`, `AuthorProfileView.tsx`, `AuthorsDirectory.tsx`, `EditorialCollectionPage.tsx`, `NewsMosaicGrid.tsx`, `ProfileDashboard.tsx`, `RecentArticlesMosaicGrid.tsx`).
- **`escritorio/`:** `ArticleEditor.tsx` (TipTap 3), `EscritorioShell.tsx`, `ReviewActionBar.tsx`, `TagManager.tsx`, `TableControls.tsx`, `PinArticleButton.tsx`, `DeleteArticleButton.tsx`.
- **`forms/`:** `EditarArticuloForm.tsx`, `ContactForm.tsx`, `CommentForm.tsx`, `PasswordForm.tsx`.
- **`ui/` & `errors/`:** `ThemeToggle.tsx`, `LanguageToggle.tsx`, `SocialLinks.tsx`, `MarkdownRenderer.tsx`, `LegalDocumentMarkdownRenderer.tsx`, `FormattedDate.tsx`, `ConfirmDialog.tsx`, `PromptDialog.tsx`, `Toast.tsx`, `FeedbackProvider.tsx`, `RevealOnScroll.tsx`, `BackButton.tsx`, `ArticleSkeleton.tsx`, `UnderConstructionBlock.tsx`, `LiteraryError.tsx`.

---

## 5. Internationalization (i18n) Rules

1. **Canonical Dictionaries:** All UI copy lives in `src/dictionaries/gl.json` (primary default) and `src/dictionaries/es.json`, maintaining exact key parity verified by automated unit tests (`src/lib/i18n/dictionaries.test.ts`).
2. **Server & Client Access:**
   - Server Components call `await getDictionary(lang)` (`src/dictionaries/index.ts`).
   - Client Components call `getDictionaryClient(lang)` (`src/dictionaries/client.ts`) or receive pre-resolved slices as props.
3. **Bilingual Content Resolution:** Database JSONB fields (`title`, `subtitle`, `content`, `bio`) carry `{ gl, es }` payloads and are resolved safely via `resolveLocalizedText()` (`src/lib/i18n/resolveLocalizedText.ts`) with fallback to the publication's `original_language`.
4. **Locale-Prefixed Navigation:** Every internal `<Link>` and programmatic redirect must include `/${lang}/...`. Edge middleware (`src/proxy.ts`) handles bare paths, cookie persistence (`NEXT_LOCALE`), and legacy/English slug aliases.

---

## 6. Performance & Caching Guardrails

- **Public Reader Decoupling (`articulo/[slug]/page.tsx`):** Does **not** call `cookies()` or `getAuthenticatedUser()` on the server, preserving full Next.js ISR caching (`export const revalidate = 60`). Editorial moderation actions render strictly on the client via `ReviewActionBar`.
- **Listing Projection Hygiene:** Homepage, archive, news, and author directory queries omit the heavy `content` JSONB column, transferring only card metadata (`id, slug, title, subtitle, cover_image_url, type, is_pinned, published_at, created_at, users(...)`) to stay well within egress budgets.
