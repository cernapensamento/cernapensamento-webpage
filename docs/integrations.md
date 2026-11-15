# External Integrations, Security & AI Agent Discovery

Cerna Pensamento connects to managed external services for database/auth, rate limiting, transactional & batch email, bilingual AI translation, observability, and machine-readable AI agent consumption.

---

## 1. Integration Summary

| Service | Package / Protocol | Primary Touchpoints | Purpose |
| :--- | :--- | :--- | :--- |
| **Supabase** | `@supabase/ssr`, `@supabase/supabase-js` | `src/lib/supabase/`, `src/proxy.ts`, `src/app/auth/` | PostgreSQL + RLS, GoTrue Auth, JWT Custom Access Token Hook, Vault secrets, `media` Storage bucket |
| **Google OAuth 2.0** | Supabase GoTrue PKCE | `src/app/[lang]/login/`, `src/app/auth/callback/route.ts` | Single sign-on alongside Email/Password authentication |
| **Upstash Redis** | `@upstash/ratelimit` | `src/proxy.ts` | Sliding-window edge rate limiting (`apiLimiter` 10/1m, `globalMutationLimiter` 30/1m) |
| **Resend + React Email** | `resend`, `@react-email/components` | `src/app/api/contact/`, `src/app/api/webhooks/newsletter/`, `src/lib/email/` | Contact form delivery (with PDF attachments) and 100-recipient batch HTML newsletters |
| **Google Gemini AI** | `@google/genai` | `src/app/api/translate/route.ts` | Bilingual Galician ↔ Spanish literary translation (`gemini-3.5-flash-lite`) inside `/escritorio` |
| **Sentry** | `@sentry/nextjs` | `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx` | Full-stack error tracking and runtime instrumentation |

---

## 2. Email & Newsletter Lifecycle (`Resend` + `HMAC`)

### Transactional Contact (`/api/contact`)
- Validated by `website` honeypot check and edge rate limiting.
- Accepts optional PDF manuscript attachments up to **3.5 MiB** verified by `%PDF-` magic bytes before forwarding via Resend (`CONTACT_FROM_EMAIL` → `CONTACT_TO_EMAIL`).

### Editorial Newsletter & RFC 8058 Unsubscribe (`src/lib/email/`)
- **Email Rendering:** `NewsletterEmail.tsx` renders responsive bilingual editorial alerts linking directly to the newly published work.
- **One-Click & List-Unsubscribe Headers:** `src/lib/email/newsletter.ts` signs each subscriber email with HMAC-SHA256 (`UNSUBSCRIBE_TOKEN_SECRET`), attaching both browser unsubscribe links (`GET /api/newsletter/unsubscribe`) and machine-readable `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers (`POST /api/newsletter/unsubscribe`) backed by `UnsubscribePage.tsx` and the `unsubscribe_newsletter_by_email` RPC.
- **Webhook Authentication:** `/api/webhooks/newsletter` verifies incoming PostgreSQL `pg_net` calls with constant-time `crypto.timingSafeEqual` against `WEBHOOK_SECRET`.

---

## 3. AI Translation (`@google/genai`)

- `POST /api/translate` requires an authenticated writer session (`canAccessWriterDesk(role)`) and input size bounds.
- Invokes `@google/genai` using **`gemini-3.5-flash-lite`** to translate publication titles, subtitles, and HTML bodies cleanly while preserving TipTap markup between `gl` and `es`.

---

## 4. Machine-Readable & AI Agent Discovery

Cerna exposes first-class structured access for search engines, LLM indexers, and reader agents without forcing localization redirects:

- **`/llms.txt` (`public/llms.txt`) & `/agent-instructions.md` (`public/agent-instructions.md`):** Root discovery files explicitly bypassed from locale redirection in `src/proxy.ts` (`STATIC_DISCOVERY_FILES`).
- **Content Negotiation (`src/proxy.ts` + `/api/markdown`):** Any request to public routes sending `Accept: text/markdown` is rewritten seamlessly to `/api/markdown` (`src/lib/agent/markdown.ts`), returning normalized Markdown for homepage summaries, articles, and legal charters (`Vary: Accept`).
- **`src/app/robots.ts` & `src/app/sitemap.ts`:** Dynamically emit crawl directives and bilingual `<xhtml:link rel="alternate">` sitemaps for published content.

---

## 5. Required Environment Variables

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Supabase project URL (`http://127.0.0.1:54321` locally) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public Supabase anon key governed by PostgreSQL RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Privileged key for webhook newsletter claim & subscriber RPCs |
| `NEXT_PUBLIC_SITE_URL` | Client & Server | Canonical base URL (`https://cernapensamento.org` in production) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client | Google OAuth 2.0 client identifier |
| `UPSTASH_REDIS_REST_URL` | Edge / Server | Upstash Redis REST endpoint for `src/proxy.ts` limiters |
| `UPSTASH_REDIS_REST_TOKEN` | Edge / Server | Upstash Redis authentication token |
| `RESEND_API_KEY` | Server Only | Resend API key for contact form & newsletter dispatch |
| `CONTACT_FROM_EMAIL` | Server Only | Verified sender address for outbound Resend mail |
| `CONTACT_TO_EMAIL` | Server Only | Editorial inbox receiving `/api/contact` messages |
| `WEBHOOK_SECRET` | Server & DB Vault | Shared bearer secret verified via `timingSafeEqual` on `/api/webhooks/newsletter` |
| `UNSUBSCRIBE_TOKEN_SECRET` | Server Only | Secret key for HMAC-SHA256 RFC 8058 unsubscribe tokens |
| `GEMINI_API_KEY` | Server Only | Google Gemini API key powering `/api/translate` |
| `RUN_DB_TESTS` | Test Only | Opt-in flag (`1`) enabling live RLS suite (`npm run test:db`) |
