# Backend, Edge Middleware & Server Actions

The backend surface comprises Next.js Edge/Proxy middleware (`src/proxy.ts`), six Route Handlers under `src/app/api/`, Auth OAuth/OTP handlers under `src/app/auth/`, and domain Server Actions under `src/actions/`.

---

## 1. Perimeter Edge Middleware (`src/proxy.ts`)

Every non-static HTTP request passes through `src/proxy.ts` before hitting App Router pages or Route Handlers:

1. **Static Discovery Bypass (`STATIC_DISCOVERY_FILES`):**
   Requests for `/llms.txt`, `/agent-instructions.md`, `/robots.txt`, and `/sitemap.xml` bypass locale redirection so crawlers and AI agents fetch canonical root manifests cleanly.
2. **Locale Resolution (`gl` default, `es`):**
   Determines locale from URL segment, `NEXT_LOCALE` cookie, or `Accept-Language` header via `negotiator` + `@formatjs/intl-localematcher`. Bare paths redirect to `/${lang}/...`.
3. **Localized Route Alias Canonicalization:**
   Normalizes convenience/English paths to canonical localized routes (e.g. `privacy` → `privacidad`, `about` → `asociacion`, `contact` → `contacto`).
4. **Markdown Content Negotiation (`handleMarkdownNegotiation`):**
   Intercepts requests requesting `Accept: text/markdown` and rewrites/serves clean structured Markdown via `/api/markdown` (`src/lib/agent/markdown.ts`).
5. **Dual-Tier Upstash Redis Rate Limiting:**
   - **`apiLimiter` (`10 req / 1 min` sliding window):** Applied to `/api/*` routes, explicitly **excluding** `/api/webhooks/` so authenticated database/cron webhooks are never dropped by edge IP throttling.
   - **`globalMutationLimiter` (`30 req / 1 min` sliding window):** Applied to state-changing HTTP methods (`POST`, `PUT`, `DELETE`, `PATCH`) across non-webhook routes.
6. **Authentication Perimeter:**
   Uses `@supabase/ssr` to refresh session cookies and protect `/escritorio/*` routes (redirecting unauthenticated traffic to `/${lang}/login`, while bouncing already-signed-in users off `/login` into `/${lang}/escritorio`).

---

## 2. Route Handlers Inventory (`src/app/api/` & `src/app/auth/`)

| Endpoint | Method | Auth / Security | Purpose & Implementation Details |
| :--- | :--- | :--- | :--- |
| **`/api/contact`** | `POST` | Public (rate-limited + `website` honeypot) | Parses `multipart/form-data`, validates attachment size (`<= 3.5 MiB`) and `%PDF-` magic header, and dispatches contact/manuscript submissions via **Resend** (`CONTACT_FROM_EMAIL` → `CONTACT_TO_EMAIL`). |
| **`/api/translate`** | `POST` | Supabase Auth (`canAccessWriterDesk(role)`) | Validates payload sizes and calls Google Gemini (`@google/genai`, model `gemini-3.5-flash-lite`) to produce faithful editorial translations between `gl` and `es`. |
| **`/api/webhooks/newsletter`** | `POST` | Constant-time `timingSafeEqual` Bearer `WEBHOOK_SECRET` | Triggered by PostgreSQL (`pg_net` / `pg_cron`) upon publication release. Atomically claims `newsletter_sent_at` (`claimPublicationForNewsletter`), loads subscribers via `getNewsletterSubscribers` RPC, renders React Email (`NewsletterEmail.tsx`) with HMAC unsubscribe tokens + RFC 8058 headers, and dispatches in **100-recipient chunks** via `resend.batch.send()`. Releases claim if 0 batches succeed. |
| **`/api/newsletter/unsubscribe`** | `GET`, `POST` | Signed HMAC-SHA256 token (`UNSUBSCRIBE_TOKEN_SECRET`) | Supports both browser one-click confirmation HTML (`GET`, `UnsubscribePage.tsx`) and RFC 8058 list-unsubscribe `POST` JSON callbacks, invoking `unsubscribe_newsletter_by_email` RPC. |
| **`/api/articulo/[slug]/pdf`** | `GET` | Public (`nodejs` runtime) | Generates printable PDF editions via `buildArticlePdf` (`pdf-lib`), returning `s-maxage=86400, stale-while-revalidate=604800` CDN headers. |
| **`/api/markdown`** | `GET` | Public (`Vary: Accept`) | Renders structured Markdown representations (`?type=home\|article\|legal&slug=...&lang=...`) backed by `src/lib/agent/markdown.ts`. |
| **`/auth/callback`** | `GET` | OAuth 2.0 PKCE code exchange | Exchanges Google OAuth `code` for Supabase session cookies and redirects safely to localized targets. |
| **`/auth/confirm`** | `GET` | Supabase OTP `token_hash` | Verifies email signup and password recovery links (`verifyOtp`) before redirecting cleanly. |

---

## 3. Server Actions (`src/actions/`)

### Publication Workflows (`src/actions/articles.ts`)
- **`saveArticleAction`:**
  - Verifies session via `getAuthenticatedUser()`, builds sanitized bilingual payloads (`buildContentPayload` applying `stripIndex`), generates/preserves slugs, resolves author quotas, syncs tag associations (`publication_tags`), and enforces role-based publish rights:
    - `founder` / `admin` may save as `published`, `in_review`, or `draft`.
    - `member` / `guest` submissions enter `in_review` (or `draft`) and cannot self-publish.
  - Revalidates affected localized routes (`/[lang]`, `/[lang]/articulos`, `/[lang]/articulo/[slug]`, `/[lang]/escritorio`) via `revalidatePath`.
- **`fetchMoreArticlesAction`:**
  - Server-paged cursor/offset loader returning lightweight article card projections for `/[lang]/articulos` incremental browsing.
- **`updateArticleState`:**
  - Editorial moderation & pin toggle (`published`, `rejected`, `in_review`, `is_pinned`) gated to authorized editorial roles and ownership rules, with automatic path revalidation.

### Authentication Actions (`src/actions/auth.ts`)
- **`handleSignOut`:** Clears the active Supabase SSR session and redirects cleanly to the active locale's root path.
