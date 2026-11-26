import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { i18n, isSupportedLocale, type Locale } from './i18n-config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { handleMarkdownNegotiation } from '@/lib/agent/markdown';

// ---------------------------------------------------------------------
// CONFIGURATION & RATE LIMITERS
// ---------------------------------------------------------------------

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/api',
    })
  : null;

const globalMutationLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/global',
    })
  : null;

const ROUTE_ALIASES: Record<string, string> = {
  privacy: 'privacidad',
  about: 'asociacion',
  contact: 'contacto',
};

const EXCLUDED_PREFIXES = [
  '/api',
  '/auth',
  '/_next',
  '/favicon.ico',
  '/images',
  '/llms.txt',
  '/agent-instructions.md',
  '/robots.txt',
  '/sitemap.xml',
];

const STATIC_DISCOVERY_FILES = new Set([
  '/llms.txt',
  '/agent-instructions.md',
  '/robots.txt',
  '/sitemap.xml',
]);

// ---------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------

function withVaryAccept(res: NextResponse): NextResponse {
  const existingVary = res.headers.get('Vary');
  if (!existingVary) {
    res.headers.set('Vary', 'Accept');
  } else if (!existingVary.includes('Accept')) {
    res.headers.set('Vary', `${existingVary}, Accept`);
  }
  return res;
}

function getLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  const negotiatorHeaders = Object.fromEntries(request.headers.entries());
  try {
    const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
    const matched = matchLocale(languages, [...i18n.locales], i18n.defaultLocale);
    return isSupportedLocale(matched) ? matched : i18n.defaultLocale;
  } catch {
    return i18n.defaultLocale;
  }
}

function createRateLimitResponse(message: string, limit: number, remaining: number, reset: number) {
  return new NextResponse(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  });
}

async function handleRateLimiting(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  if (!redis) return null;

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';

  try {
    if (
      pathname.startsWith('/api/') &&
      !pathname.startsWith('/api/webhooks/') &&
      pathname !== '/api/storage/upload'
    ) {
      const { success, limit, reset, remaining } = await apiLimiter!.limit(ip);
      if (!success) {
        return createRateLimitResponse('Too Many Requests', limit, reset, remaining);
      }
    } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const { success, limit, reset, remaining } = await globalMutationLimiter!.limit(ip);
      if (!success) {
        return createRateLimitResponse('Demasiadas peticiones. Por favor, espera un minuto.', limit, reset, remaining);
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
  }

  return null;
}

function handleRouteAliases(request: NextRequest, pathname: string, currentLocale: Locale): NextResponse | null {
  const segments = pathname.split('/').filter(Boolean);
  if (isSupportedLocale(segments[0])) {
    segments.shift();
  }
  const barePath = segments.join('/');

  if (ROUTE_ALIASES[barePath]) {
    const target = ROUTE_ALIASES[barePath];
    return withVaryAccept(
      NextResponse.redirect(new URL(`/${currentLocale}/${target}${request.nextUrl.search}`, request.url))
    );
  }
  return null;
}

async function handleAuthProtection(
  request: NextRequest,
  pathname: string,
  currentLocale: Locale,
  requestHeaders: Headers
): Promise<NextResponse> {
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const isEscritorio = /^(\/[a-z]{2})?\/escritorio/.test(pathname);
  const isLogin = /^(\/[a-z]{2})?\/login$/.test(pathname);

  if (!isEscritorio && !isLogin) {
    return withVaryAccept(response);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return withVaryAccept(response);
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

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

  return withVaryAccept(response);
}

// ---------------------------------------------------------------------
// MAIN PROXY MIDDLEWARE
// ---------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // 1. Bypass static discovery files immediately
    if (STATIC_DISCOVERY_FILES.has(pathname)) {
      return withVaryAccept(NextResponse.next());
    }

    const isExcluded = EXCLUDED_PREFIXES.some((path) => pathname.startsWith(path));

    // 2. Determine Locale
    const firstSegment = pathname.split('/')[1];
    const currentLocale: Locale = isSupportedLocale(firstSegment)
      ? firstSegment
      : isExcluded
        ? i18n.defaultLocale
        : getLocale(request);

    // 3. Trust Anchor Route Aliases (/privacy, /about, /contact)
    const aliasResponse = handleRouteAliases(request, pathname, currentLocale);
    if (aliasResponse) return aliasResponse;

    // 4. Content Negotiation (Markdown representation for AI Agents)
    const markdownResponse = handleMarkdownNegotiation(request, pathname, currentLocale);
    if (markdownResponse) return markdownResponse;

    // 5. Rate Limiting Check
    const rateLimitResponse = await handleRateLimiting(request, pathname);
    if (rateLimitResponse) return rateLimitResponse;

    // 6. i18n Redirection if missing locale prefix
    if (!isExcluded && !isSupportedLocale(firstSegment)) {
      const destination = `/${currentLocale}${pathname === '/' ? '' : pathname}${request.nextUrl.search}`;
      return withVaryAccept(NextResponse.redirect(new URL(destination, request.url)));
    }

    // 7. Base request headers & Auth Protection
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', currentLocale);

    return await handleAuthProtection(request, pathname, currentLocale, requestHeaders);
  } catch (err) {
    console.error('[Proxy:Fatal] Unhandled proxy error:', err);
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
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|agent-instructions.md|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
