import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { i18n } from './i18n-config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Inicializar Redis solo si las variables de entorno están presentes
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limiter para API y Webhooks
const apiLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/api',
}) : null;

// Rate limiter global para POST/PUT/DELETE
const globalMutationLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/global',
}) : null;

/**
 * Selects a supported locale from NEXT_LOCALE, then Accept-Language, falling
 * back to the default locale when negotiation fails or has no supported match.
 */
function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && (i18n.locales as readonly string[]).includes(cookieLocale as (typeof i18n.locales)[number])) {
    return cookieLocale;
  }

  const locales: string[] = [...i18n.locales];
  try {
    const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
    return matchLocale(languages, locales, i18n.defaultLocale);
  } catch {
    return i18n.defaultLocale;
  }
}

/**
 * Applies locale redirects/headers, optional Redis rate limits, and session
 * redirects for dashboard/login routes. Successful session refreshes update cookies.
 * Returns 429 for exceeded limits; Redis failures, auth exceptions, and missing
 * auth configuration allow processing to continue. Unexpected outer errors pass
 * the request through with an X-Proxy-Error response header. Discovery text/XML
 * endpoints bypass these checks.
 */
export async function proxy(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const isExcluded = [
      '/api',
      '/auth',
      '/_next',
      '/favicon.ico',
      '/images',
      '/llms.txt',
      '/robots.txt',
      '/sitemap.xml',
    ].some((path) => pathname.startsWith(path));

    // Bypass excluded static files immediately
    if (pathname === '/llms.txt' || pathname === '/robots.txt' || pathname === '/sitemap.xml') {
      return NextResponse.next();
    }

    // Determine Locale
    let currentLocale: string = i18n.defaultLocale;
    const localeMatch = pathname.match(/^\/([^/]+)/);
    if (localeMatch && (i18n.locales as readonly string[]).includes(localeMatch[1] as (typeof i18n.locales)[number])) {
      currentLocale = localeMatch[1] as 'gl' | 'es';
    } else if (!isExcluded) {
      currentLocale = getLocale(request) as 'gl' | 'es';
    }

    // --- Rate Limiting Logic ---
    if (redis) {
      const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
      
      try {
        if (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks/')) {
          const { success, limit, reset, remaining } = await apiLimiter!.limit(ip);
          if (!success) {
            return new NextResponse(
              JSON.stringify({ error: 'Too Many Requests' }),
              {
                status: 429,
                headers: {
                  'Content-Type': 'application/json',
                  'X-RateLimit-Limit': limit.toString(),
                  'X-RateLimit-Remaining': remaining.toString(),
                  'X-RateLimit-Reset': reset.toString(),
                },
              }
            );
          }
        } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
          const { success, limit, reset, remaining } = await globalMutationLimiter!.limit(ip);
          if (!success) {
            return new NextResponse(
              JSON.stringify({ error: 'Demasiadas peticiones. Por favor, espera un minuto.' }),
              {
                status: 429,
                headers: {
                  'Content-Type': 'application/json',
                  'X-RateLimit-Limit': limit.toString(),
                  'X-RateLimit-Remaining': remaining.toString(),
                  'X-RateLimit-Reset': reset.toString(),
                },
              }
            );
          }
        }
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Fail open if Redis is down
      }
    }
    // -------------------------

    // 1. Prepare Request Headers (x-locale)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', currentLocale);

    let supabaseResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });

    // 2. i18n Redirection
    if (!isExcluded) {
      const pathnameIsMissingLocale = i18n.locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
      );

      if (pathnameIsMissingLocale) {
        return NextResponse.redirect(
          new URL(`/${currentLocale}${pathname === '/' ? '' : pathname}${request.nextUrl.search}`, request.url)
        );
      }
    }

    // 3. Auth Protection (Handling [lang] prefix) - Only query Supabase Auth for protected/login routes
    const isEscritorio = /^(\/[a-z]{2})?\/escritorio/.test(pathname);
    const isLogin = /^(\/[a-z]{2})?\/login$/.test(pathname);

    if (isEscritorio || isLogin) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        try {
          const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = NextResponse.next({
                  request: {
                    headers: requestHeaders,
                  },
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                  supabaseResponse.cookies.set(name, value, options)
                );
              },
            },
          });

          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user && isEscritorio) {
            const url = request.nextUrl.clone();
            url.pathname = `/${currentLocale}/login`;
            return NextResponse.redirect(url);
          }

          if (user && isLogin) {
            const url = request.nextUrl.clone();
            url.pathname = `/${currentLocale}/escritorio`;
            return NextResponse.redirect(url);
          }
        } catch (authError) {
          console.error('[Proxy:Auth] Failed to verify auth session:', authError);
        }
      } else {
        console.warn('[Proxy:Auth] Supabase environment variables are missing');
      }
    }

    return supabaseResponse;
  } catch (err) {
    console.error('[Proxy:Fatal] Unhandled proxy error:', err);
    // Graceful fallback to avoid taking down the whole application with a 500
    const fallbackResponse = NextResponse.next();
    fallbackResponse.headers.set(
      'X-Proxy-Error',
      err instanceof Error ? err.message : 'Unknown proxy error'
    );
    return fallbackResponse;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
