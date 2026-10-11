<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Cerna Pensamento

Comprehensive operating guide and architectural reference for AI coding agents and engineers working on the **Cerna Pensamento** repository.

---

## 1. Project Overview & Identity

* **Project Name:** Cerna Pensamento
* **Production Domain:** `https://cernapensamento.org`
* **Nature:** Digital cultural journal and intellectual magazine focused on political philosophy, Austrian economics, social sciences, essays, reviews, poetry, and narrative.
* **Languages (i18n):** Bilingual platform with Galician (`gl` — default primary locale) and Spanish (`es`).
* **Design Philosophy:** Sobriety, editorial typography, classical literary feeling, high readability, paper-like palette (`parchment`, `charcoal`, `gold`), responsive design, and seamless dark mode.

---

## 2. Technology Stack

| Layer | Technologies & Dependencies | Version |
|---|---|---|
| **Core Framework** | Next.js App Router, React, React DOM | Next `16.2.x`, React `19.2.x` |
| **Language & Typings** | TypeScript (`strict` mode), ESLint 9 | TS `5.x`, ESLint `9.x` |
| **Styling & Design** | Tailwind CSS v4 (`@tailwindcss/postcss`), CSS Variables | Tailwind `4.x` |
| **Typography & Icons** | `Libre Caslon Text` (Serif), `Source Sans 3` (Sans), Google Material Symbols | Next Font / Google Fonts |
| **Database & Auth** | Supabase PostgreSQL, `@supabase/ssr`, `@supabase/supabase-js`, GoTrue | Postgres 15+, Supabase SSR `0.12.x` |
| **WYSIWYG Editor** | TipTap 3, ProseMirror, KaTeX (math), custom tables, custom index | TipTap `3.27.x`, KaTeX `0.16.x` |
| **Sanitization** | `sanitize-html` | `2.17.x` |
| **Edge & Rate Limiting** | Next.js Edge Middleware (`src/proxy.ts`), Upstash Redis, `@upstash/ratelimit` | Upstash Redis `1.38.x` |
| **AI Translation** | Google Gemini (`@google/genai`) | Gemini Flash-Lite / 2.5 |
| **Transactional Email** | Resend API | Resend `6.17.x` |
| **Observability** | Sentry Next.js SDK | `@sentry/nextjs` |

---

## 3. Repository Directory Structure

```
cerna/
├── src/
│   ├── actions/                  # Next.js Server Actions (articles.ts, auth.ts)
│   ├── app/                      # Next.js App Router tree
│   │   ├── [lang]/               # Localized public and private routes
│   │   │   ├── articulo/[slug]/  # Public article reader & comments
│   │   │   ├── articulos/        # Articles archive & topic filter
│   │   │   ├── asociacion/       # Institutional pages (manifesto, statutes, editorial collections)
│   │   │   ├── autor/[slug]/     # Author profile & author's publications
│   │   │   ├── contacto/         # Contact form page
│   │   │   ├── escritorio/       # Private dashboard & TipTap editor (/nuevo, /editar/[slug])
│   │   │   ├── login/            # Authentication page (Google OAuth + Email/Password)
│   │   │   ├── layout.tsx        # Root localized layout (NavBar, Footer, ThemeProvider)
│   │   │   └── page.tsx          # Homepage (Hero, Pinned, Columnists, Themes)
│   │   ├── api/                  # Route Handlers
│   │   │   ├── contact/          # POST: sends contact inquiries via Resend
│   │   │   ├── translate/        # POST: bilingual translations via Gemini AI
│   │   │   └── webhooks/         # Database webhooks (e.g. newsletter dispatch)
│   │   ├── auth/                 # Auth OAuth callbacks (/callback, /confirm)
│   │   └── globals.css           # Tailwind v4 theme definitions and base styles
│   ├── components/               # Modular React components by domain
│   │   ├── escritorio/           # TipTap editor, toolbars, metadata sidebars, table controls
│   │   ├── features/             # Article cards, comments, topic filter bar, author profile
│   │   ├── forms/                # ContactForm, ArticleSubmissionForm, CommentForm
│   │   ├── layout/               # PublicNavBar, SideMenu drawer, SiteFooter
│   │   ├── sections/             # Homepage sections (FeaturedHero, Columnists, Themes)
│   │   └── ui/                   # Shared UI primitives (SocialLinks, ThemeToggle, LanguageToggle)
│   ├── dictionaries/             # Canonical i18n JSONs: gl.json (default), es.json
│   ├── hooks/                    # React hooks (useAuth, useLocale)
│   ├── lib/                      # Editor extensions, KaTeX renderer, constants, columnist metadata
│   ├── proxy.ts                  # Perimeter Edge middleware (i18n, rate limiting, auth gating)
│   └── utils/                    # Supabase SSR clients (server.ts, client.ts) and auth helpers
├── database/                     # SQL schemas, migration scripts, and seed CSVs
│   ├── schema_global_actualizado.sql  # Complete canonical PostgreSQL schema
│   ├── auth.users/               # User restoration scripts and JSON backups
│   └── csv_data/                 # Table data exports (articulos, perfiles, tags, etc.)
├── docs/                         # Architecture codemaps and operational protocols
│   ├── CODEMAPS/                 # Modular architectural blueprints (frontend, backend, editor, etc.)
│   ├── style-guide.md            # Visual style guide for executive reports
│   └── RELEASE_PROTOCOL.md       # 4-phase branch release, commits, and PR preparation guide
└── public/                       # Static assets (images, logos, fonts)
```

---

## 4. Critical Invariants & Rules (MUST NEVER BE BROKEN)

### 4.1. Next.js 16 & React 19 Breaking API Conventions
* **Asynchronous `params` and `searchParams`:**  
  In Next.js 16 App Router, `params` and `searchParams` in page components and `generateMetadata` **are Promises**. Always await them:
  ```tsx
  // ✅ Correct:
  export default async function Page({ params }: { params: Promise<{ lang: string; slug: string }> }) {
    const { lang, slug } = await params;
    ...
  }
  ```
* **Asynchronous Cookies & Headers:**  
  `cookies()` and `headers()` from `next/headers` must always be awaited: `const cookieStore = await cookies();`.
* **Server Components by Default:**  
  Keep components as Server Components unless interactivity, state, event listeners, or browser APIs require `'use client'`.

### 4.2. Internationalization (i18n) Rules
* **Bilingual Parity:**  
  Every public UI string must exist in both `src/dictionaries/gl.json` and `src/dictionaries/es.json`. Never hardcode raw strings in components.
* **Database Multilingual Fields:**  
  Publications and profiles use unified JSONB fields: `title` (`{ gl, es }`), `subtitle` (`{ gl, es }`), `content` (`{ gl, es }`), and `bio` (`{ gl, es }`). Always supply both language variants.
* **Path Prefixing:**  
  All localized routes must begin with `/${lang}/` (`/gl` or `/es`). Use the helper `LanguageToggle` or construct internal links using `/${lang}/...`.

### 4.3. Supabase Egress & Database Bandwidth Guardrails
* **Zero Hardcoded Table or Column Strings:**  
  Always use the Data Access Layer constants (`DB_TABLES`, `PUBLICATION_COLS`, `USER_COLS`, `TAG_COLS`, `PUBLICATION_STATUSES`, `USER_ROLES`) from `src/lib/db/schema`.
* **Never Query Heavy Content on Listings:**  
  On the homepage (`page.tsx`), archive (`articulos/page.tsx`), news, and author profiles, **never select full article content** (`content`). Select only the metadata needed for cards (`id, slug, title, subtitle, cover_image_url, type, created_at, users(full_name)`).
* **Decouple Auth from Public Reader SSR:**  
  Public article pages (`/articulo/[slug]`) must not call `getAuthenticatedUser()` / `cookies()` during initial server render. Doing so disables static caching/ISR and triggers dynamic SSR on every bot/crawler hit. Keep reader rendering cached (ISR `revalidate = 60` or on-demand revalidation) and handle user-specific review actions on the client.
* **Storage Bucket Rules:**  
  * Use the single public bucket: `imagenes-articulos`.
  * Standard paths:
    * Covers: `portadas/{userId}/{timestamp}.{ext}`
    * In-article images: `contenido/{userId}/{timestamp}-{safeName}`
    * Avatars: `avatares/{userId}/{timestamp}.{ext}`
  * Client-side compression must be enforced before uploading images (max 1600px width, WebP/JPEG quality 80%) to avoid exhausting storage egress quotas.
* **PostgreSQL Schema Constraints:**  
  * Taxonomy uses normalized relational tables: `publication_tags` connects `publications` to `tags`.
  * Public read on `publications` is protected by RLS: anonymous visitors can only select rows where `status = 'published'`.
  * Editorial role hierarchy: `reader`, `guest`, `member`, `founder`, `admin`. Only `founder` and `admin` can directly publish articles (`status = 'published'`). `member` and `guest` submissions enter review (`status = 'in_review'`).

### 4.4. TipTap Editor & HTML Sanitization Pipeline
* **Rendering Order:**  
  When rendering article content in `src/app/[lang]/articulo/[slug]/page.tsx`, the sequence is strict:
  1. `renderMathInHtml(content)` (converts `$math$` and LaTeX blocks to KaTeX HTML).
  2. `renderHeadingAnchors(...)` (injects slug IDs into headings for TOC linking).
  3. `sanitizeHtml(...)` (cleans unsafe tags, attributes, and scripts).
* **Sanitization Whitelist:**  
  Any custom TipTap node, inline style, or attribute generated by the editor (e.g., `<nav data-type="article-index">`, `<figure>`, `<table>`, KaTeX math elements) **must be explicitly whitelisted** in `sanitizeHtml` options in `articulo/[slug]/page.tsx`. If omitted, production will silently drop the element.

### 4.5. Editorial Design Tokens (Tailwind v4)
Always use semantic CSS variables via Tailwind classes to ensure dark mode works automatically:
* Backgrounds: `bg-parchment` (base), `bg-surface` (cards, drawers, inputs).
* Text: `text-charcoal` (primary text), `text-charcoal/60` (subtitles/metadata), `text-gold` (accent labels, active links).
* Borders: `border-lines` (dividers, table borders).
* Fonts: `font-serif` (`Libre Caslon Text`) for headlines, pull quotes, and titles; `font-sans` (`Source Sans 3`) for body copy, UI, and buttons.

---

## 5. Agent Behavioral Protocol (How to Work on This Codebase)

When tasked with fixing bugs, implementing features, or refactoring code in Cerna:

### 1. Plan Before Executing
* Review existing components and codemaps in `docs/CODEMAPS/` before introducing new abstractions.
* If making multi-file modifications, formulate a clear, sequential plan.

### 2. Surgical, High-Cohesion Edits
* Keep changes minimal and focused. Do not reformat unrelated code, reorder imports gratuitously, or remove existing comments and docstrings.
* Maintain immutability: return new objects or arrays instead of mutating state in React components.

### 3. Verify TypeScript & Linting
* After code modifications, always verify with:
  ```bash
  npm run lint
  ```
* Address any type errors (`@typescript-eslint/no-explicit-any`), unused variables, or React hook dependency warnings immediately.

### 4. Git & Commit Guidelines (Strictly Local)
* **Atomic Commits:** Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`, `docs:`).
* **Never Run Massive Adds:** Do not run `git add .` or `git commit -am`. Add individual files per atomic commit.
* **CRITICAL RULE — Never Push:**  
  The agent is strictly forbidden from executing `git push` or merging on GitHub. The human developer reviews, verifies, pushes, and merges.
* **Release Protocol:**  
  When the user asks to prepare a branch for delivery or release, adhere to [`docs/RELEASE_PROTOCOL.md`](docs/RELEASE_PROTOCOL.md):
  1. Propose and execute atomic commits locally.
  2. For client-facing milestones, draft the executive, non-technical report in `docs/reports/<branch>-<date>/reporte-cambios.md` following [`docs/style-guide.md`](docs/style-guide.md).
  3. Compile the PDF using Pandoc / Chromium.
  4. Generate the GitHub Pull Request summary for the user to review.

---

## 6. Common Developer Workflows

### Running the Development Server
```bash
npm run dev
```

### Running Typechecks & Lint
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

### Adding a New UI String / Translation
1. Add the Galician key-value in `src/dictionaries/gl.json`.
2. Add the corresponding Spanish key-value in `src/dictionaries/es.json`.
3. In Server Components, retrieve via `const dict = await getDictionary(lang);`.
4. In Client Components, retrieve via `getDictionaryClient(lang)` or pass down from the parent Server Component.

### Applying Database Changes
1. Update `database/schema_global_actualizado.sql` with the new tables, policies, or functions.
2. Execute the migration in the Supabase SQL Editor.
3. Update relevant types and Server Actions in `src/actions/`.
