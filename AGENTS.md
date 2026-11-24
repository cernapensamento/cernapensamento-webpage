<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Cerna Pensamento

Operating guide and navigation index for AI coding agents working on **Cerna Pensamento** (`https://cernapensamento.org`), a bilingual cultural journal in Galician (`gl`, default) and Spanish (`es`).

## Agent skills

### Issue tracker
Local Markdown under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels
Canonical 5-role label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs
Single-context layout (`GLOSSARY.md` at repo root + `docs/adr/`). Read `GLOSSARY.md` and relevant ADRs before exploring or editing domain code. See `docs/agents/domain.md`.

### Coding standards
Review-time standards for Next.js 16, i18n, DAL, sanitization, and UI composition live in `CODING_STANDARDS.md`.

## Architecture & Reference Docs

Consult the relevant reference doc before changing a subsystem (and keep it synced when contracts change):
- `docs/INDEX.md` — architecture overview & module map
- `docs/frontend.md` — App Router, layouts, design tokens, i18n
- `docs/editor.md` — TipTap 3, KaTeX, tables, TOC, sanitization pipeline
- `docs/backend.md` — Edge proxy (`src/proxy.ts`), Server Actions, Route Handlers
- `docs/database.md` — PostgreSQL schema, constraints, DAL, RLS, Storage, newsletter dispatches
- `docs/integrations.md` — Supabase, Upstash, Resend, Gemini AI, Sentry, AI agent Markdown
- `docs/adr/` — accepted Architecture Decision Records (e.g., `0001-monolingual-publications.md`)

Do not create `docs/issues/`, `docs/reports/`, `docs/CODEMAPS/`, or standalone protocol files; keep local visualizers (`docs/architecture.html`, `.archify/`) git-ignored.

## Core Invariants

1. **Next.js 16 async APIs:** Always await `params`, `searchParams`, `cookies()`, and `headers()`. Keep public reader pages (`/articulo/[slug]`) decoupled from `getAuthenticatedUser()` / `cookies()` to preserve ISR.
2. **Bilingual UI & Monolingual/Bilingual Publications:** Keep `src/dictionaries/gl.json` and `src/dictionaries/es.json` in strict key parity and prefix all internal links with `/${lang}/...`. Publications support both **Bilingual** (`gl` + `es`) and **Monolingual** (`gl`-only or `es`-only) publishing derived from stored JSONB keys (`@/lib/i18n/publicationLanguage`; see `docs/adr/0001-monolingual-publications.md`).
3. **DAL & Egress:** Import schema identifiers from `@/lib/db/schema` (zero magic strings). Never select full `content` in listing, archive, author, sitemap, or dashboard queries.
4. **Sanitization & Storage:** Render publication HTML in strict order (`stripIndex` → `renderMathInHtml` → `renderHeadingAnchors` → `sanitizeArticleHtml`) with editor nodes whitelisted in `ARTICLE_SANITIZER_CONFIG`. Upload via `uploadStorageImage()` (WebP) and clean up covers/inline images across all locale keys via `cleanupPublicationImages()`.

Full review standards are in `CODING_STANDARDS.md`.

## Git Lifecycle & Verification Protocol

### Stage 1: Isolated Git Worktree
Never work directly on `development` or `main`. Create a dedicated worktree under `.worktrees/` branched from `development`:
```bash
git worktree add .worktrees/<branch-name> -b <branch-name> development
cd .worktrees/<branch-name>
ln -snf ../../.env.local .env.local
ln -snf ../../node_modules node_modules
```

### Stage 2: Surgical Implementation & Local Verification
Keep edits focused and minimal. Before reporting work ready, run:
```bash
npm run lint
npm run typecheck
npm test
npm run build
```
When touching `supabase/migrations/`, `supabase/seed.sql`, or DB constraints/triggers, also run:
```bash
npm run db:reset
npx supabase test db
npm run test:db
```
Update the canonical schema dump after migration changes:
```bash
npx supabase db dump --local -f database/full_schema.sql
```

### Stage 3: Review Gating & Commits
- During interactive single-branch development, **never run `git commit` without explicit user approval**; leave changes in the worktree for review and present a concise summary + verification results.
- Exception for orchestrated skill flows: during an explicit `/implement` or `/implement-spec` run, atomic Conventional Commits are permitted on isolated feature/integration worktree branches; **merging into `development` or `main` and pushing always requires explicit user approval**.

### Stage 4: Granular Micro-Commits
Stage files individually using Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`, `test:`, `docs:`, `chore:`). Never use blanket `git add .` or `git commit -am`.

### Stage 5: Merge to `development`, Cleanup & Release
After explicit user approval:
```bash
cd /home/pablo/Projects/Cerna
git checkout development
git merge <branch-name> --no-ff -m "merge: merge <branch-name> into development"
git push origin development
git worktree remove .worktrees/<branch-name>
git branch -d <branch-name>
```
**Production release (`development` → `main`):** Verify `development` matches `origin/development`, run `lint` / `typecheck` / `test` / `build` / `db:reset`, push pending migrations (`npx supabase db push`) and verify `database/full_schema.sql` is synced, then open the PR via `gh pr create --base main --head development` covering Summary, DB/Env impact, Verification results, and post-merge tag (`vX.Y.Z`) + production smoke checks.

## Local Supabase & Test Accounts

Check `package.json` for all dev/test/act/db scripts (`db:start`, `db:stop`, `db:reset`, `db:status`, `act:test`). Local endpoints: API `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`, Inbucket `http://127.0.0.1:54324`, DB port `54322`.

Seed accounts (password `Password123!`): Founders (`diegoaraujo@cernapensamento.org`, `hectorgonzalez@cernapensamento.org`, `denisfernandez@cernapensamento.org`, `anxoperez@cernapensamento.org`), Admin (`admin@cernapensamento.org`), Guest Author (`lucia.vazquez@cerna.org`), Member (`martino.rodriguez@cerna.org`), Reader (`lector@cerna.org`).
