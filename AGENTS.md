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
| **Data Access Layer (DAL)** | Strongly-typed queries, constants & models (`src/lib/db/`) | Custom TypeScript DAL |
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
│   │   │   ├── escritorio/       # Private dashboard & TipTap editor (/nuevo, /editar/[slug], /perfil)
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
│   │   ├── forms/                # ContactForm, ArticleSubmissionForm, CommentForm, EditarArticuloForm
│   │   ├── layout/               # PublicNavBar, SideMenu drawer, SiteFooter
│   │   ├── sections/             # Homepage sections (FeaturedHero, Columnists, Themes)
│   │   └── ui/                   # Shared UI primitives (SocialLinks, ThemeToggle, LanguageToggle)
│   ├── dictionaries/             # Canonical i18n JSONs: gl.json (default), es.json
│   ├── hooks/                    # React hooks (useAuth, useLocale)
│   ├── lib/                      # Unified library: Supabase clients, auth, DAL, editor, email, PDF
│   │   ├── auth.ts               # Authenticated user & role resolver
│   │   ├── supabase/             # Supabase SSR clients (server.ts, client.ts)
│   │   ├── db/                   # Strongly-Typed Data Access Layer (DAL)
│   │   │   ├── schema.ts         # Constants: DB_TABLES, column names, enums
│   │   │   ├── types.ts          # Table rows, aggregates, and view interfaces
│   │   │   ├── queries/          # Modular typed query modules (publications, users, comments, tags)
│   │   │   └── index.ts          # Barrel export for lib/db
│   │   ├── editor/               # TipTap extensions and KaTeX renderers
│   │   ├── email/                # Newsletter email templates and token utilities
│   │   └── pdf/                  # Article PDF export generator
│   └── proxy.ts                  # Perimeter Edge middleware (i18n, rate limiting, auth gating)
├── database/                     # PostgreSQL schema definitions
│   └── full_schema.sql           # Complete canonical database schema dump (tables, RLS, functions)
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
* **Mandatory i18n Standard via Dictionaries:**  
  Cerna is a bilingual platform (`gl` default, `es`). **All public UI text, menu labels, button text, badges, placeholders, and link descriptions must be retrieved strictly from `src/dictionaries/gl.json` and `src/dictionaries/es.json`**. Never hardcode raw user-facing strings in TSX components or pages.
* **Bilingual Parity:**  
  Every dictionary key added to `src/dictionaries/gl.json` must exist with its translation in `src/dictionaries/es.json`. Regressions where a key exists only in one language break the UI and are strictly disallowed.
* **No Hardcoded URLs / Enforce Dynamic Locale Prefixing:**  
  **Never write hardcoded, unlocalized URLs** (e.g. `<Link href="/articulos">`, `<Link href="/contacto">`, or `router.push('/login')`).  
  All internal links and programmatic redirects must strictly use the active locale prefix:
  ```tsx
  // ❌ FORBIDDEN:
  <Link href="/articulos">Arquivo</Link>
  <Link href="/gl/articulos">Arquivo</Link> // Hardcoded locale

  // ✅ CORRECT:
  <Link href={`/${lang}/articulos`}>{dict.nav.articulos}</Link>
  <Link href={`/${lang}/articulo/${slug}`}>{title}</Link>
  ```
* **Database Multilingual Fields:**  
  Publications and user profiles use unified JSONB fields: `title` (`{ gl, es }`), `subtitle` (`{ gl, es }`), `content` (`{ gl, es }`), and `bio` (`{ gl, es }`). Always supply and handle both language variants.
* **Path Prefixing & Middleware Routing:**  
  All public and private app routes live under `src/app/[lang]/`. The perimeter edge middleware (`src/proxy.ts`) enforces locale detection and redirection to `/${lang}/...`. Components must never bypass this structure.

### 4.3. Data Access Layer (DAL) & Supabase Guardrails
* **Zero Magic Strings:**  
  Never hardcode table names, column names, statuses, or roles in application code. Always import identifiers from `@/lib/db/schema`:
  - Tables: `DB_TABLES.PUBLICATIONS`, `DB_TABLES.USERS`, `DB_TABLES.COMMENTS`, `DB_TABLES.TAGS`, `DB_TABLES.PUBLICATION_TAGS`.
  - Columns: `PUBLICATION_COLS`, `USER_COLS`, `COMMENT_COLS`, `TAG_COLS`, `PUBLICATION_TAG_COLS`.
  - Enums: `USER_ROLES`, `PUBLICATION_STATUSES`, `PUBLICATION_TYPES`.
* **Standard Schema Tables:**
  - `publications` (formerly `articulos`): id, slug, title, subtitle, content, cover_image_url, status, type, original_language, is_pinned, author_id, created_at, updated_at.
  - `users` (formerly `perfiles`): id, full_name, slug, bio, avatar_url, newsletter_subscribed, role.
  - `comments` (formerly `comentarios`): id, publication_id, author_id, content, updated_at.
  - `tags` & `tag_translations`: taxonomy table with localized names connected to publications via `publication_tags`.
* **Editorial Roles & Permissions:**
  - Roles: `reader`, `guest`, `member`, `founder`, `admin`.
  - Direct Publishing: Only `founder` and `admin` can directly publish (`status = 'published'`).
  - Editorial Review: Submissions from `member` and `guest` enter review (`status = 'in_review'`).
  - Approval Authority: `founder` and `admin` have rights to review, approve, or reject submissions in review.
  - Readers: `reader` is read-only and redirected away from writer desk tools to `/escritorio/perfil`.
* **Never Query Heavy Content on Listings (Egress Bandwidth Guardrail):**  
  On the homepage (`page.tsx`), archive (`articulos/page.tsx`), news, author profiles, and dashboard lists, **never select full article content** (`content`). Select only the metadata needed for cards (`id, slug, title, subtitle, cover_image_url, type, created_at, users(full_name)`).
* **Decouple Auth from Public Reader SSR:**  
  Public article pages (`/articulo/[slug]`) must not call `getAuthenticatedUser()` / `cookies()` during initial server render. Doing so disables static caching/ISR and triggers dynamic SSR on every bot/crawler hit. Keep reader rendering cached (ISR `revalidate = 60` or on-demand revalidation) and handle user-specific review actions on the client.
* **Storage Bucket Rules:**  
  * Use the single public bucket: `imagenes-articulos`.
  * Standard paths:
    * Covers: `portadas/{userId}/{timestamp}.{ext}`
    * In-article images: `contenido/{userId}/{timestamp}-{safeName}`
    * Avatars: `avatares/{userId}/{timestamp}.{ext}`
  * Client-side compression must be enforced before uploading images (max 1600px width, WebP/JPEG quality 80%) to avoid exhausting storage egress quotas.

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
* Review existing components, DAL queries in `src/lib/db/`, and codemaps in `docs/CODEMAPS/` before introducing new abstractions.
* If making multi-file modifications, formulate a clear, sequential plan.

### 2. Surgical, High-Cohesion Edits
* Keep changes minimal and focused. Do not reformat unrelated code, reorder imports gratuitously, or remove existing comments and docstrings.
* Maintain immutability: return new objects or arrays instead of mutating state in React components.

### 3. Verify TypeScript & Linting
* After code modifications, always verify with:
  ```bash
  npm run lint
  npm run build
  ```
* Address any type errors (`@typescript-eslint/no-explicit-any`), unused variables, or React hook warnings immediately.

### 4. Branching & Git Guidelines
* **Integration Branch:** The active integration branch is **`development`**. Production is on **`main`**.
* **Atomic Commits:** Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`, `docs:`).
* **Never Run Massive Adds:** Do not run `git add .` or `git commit -am`. Add individual files per atomic commit.
* **Remote Push & Release Protocol:**  
  Push changes to `development` for ongoing work. When preparing a production release or client-facing milestone, adhere to [`docs/RELEASE_PROTOCOL.md`](docs/RELEASE_PROTOCOL.md).

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

### Local Database Development & Migration Workflow (Supabase CLI)

To protect production and staging databases, **all database changes must be developed and tested locally** using the Supabase CLI Docker stack before being promoted to remote environments.

#### 1. Managing the Local Supabase Stack
* **Start local stack:** `npm run db:start` (starts PostgreSQL, GoTrue Auth, Storage, Studio, and Inbucket).
* **Stop local stack:** `npm run db:stop`.
* **Reset local database:** `npm run db:reset` (wipes local DB, applies all `supabase/migrations/` in sequence, and runs `supabase/seed.sql`).
* **Check local status & keys:** `npm run db:status`.

#### 2. Local Environment Endpoints
* **API URL:** `http://127.0.0.1:54321`
* **Local Studio Dashboard:** `http://127.0.0.1:54323`
* **Local Inbucket (Email Inbox):** `http://127.0.0.1:54324` (captures confirmation and password recovery emails locally).
* **Local DB Port:** `54322`

#### 3. Local Seed & Test Accounts
Running `npm run db:reset` populates `supabase/seed.sql` with the public taxonomy, sample publications, storage bucket `imagenes-articulos`, and pre-configured test users (password for all: `Password123!`):
* **Diego Araújo (Founder):** `diegoaraujo@cernapensamento.org`
* **Héctor González (Founder):** `hectorgonzalez@cernapensamento.org`
* **Denís Fernández (Founder):** `denisfernandez@cernapensamento.org`
* **Anxo Pérez (Founder):** `anxoperez@cernapensamento.org`
* **Admin:** `admin@cernapensamento.org`
* **Guest Author:** `lucia.vazquez@cerna.org`
* **Member:** `martino.rodriguez@cerna.org`
* **Reader:** `lector@cerna.org`

#### 4. Applying Schema Changes (Local → Remote)
1. **Create an incremental migration:**
   * Either create an empty migration file:
     ```bash
     npx supabase migration new <descriptive_name>
     ```
   * Or apply changes in Local Studio (`http://127.0.0.1:54323`) and auto-generate the SQL diff:
     ```bash
     npx supabase db diff -f <descriptive_name>
     ```
2. **Verify locally:**
   * Run `npm run db:reset` to ensure the new migration applies cleanly on an empty database alongside `supabase/seed.sql`.
3. **Synchronize Codebase DAL:**
   * Update schema constants in `src/lib/db/schema.ts` (`DB_TABLES`, column names, enums).
   * Update row types and models in `src/lib/db/types.ts` (or run `npx supabase gen types typescript --local`).
   * Update DAL queries in `src/lib/db/queries/`.
   * Run `npm run lint` and `npm run build` to catch type or query regressions.
4. **Deploy Migrations to Remote / Production:**
   * Link to the remote project once:
     ```bash
     npx supabase link --project-ref <remote-project-ref>
     ```
   * Push pending migrations:
     ```bash
     npx supabase db push
     ```
   * Update the canonical schema dump:
     ```bash
     npx supabase db dump --local -f database/full_schema.sql
     ```
