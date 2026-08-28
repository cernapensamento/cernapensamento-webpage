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

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && (i18n.locales as readonly string[]).includes(cookieLocale as any)) {
    return cookieLocale;
  }

  const locales: string[] = [...i18n.locales];
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  try {
    return matchLocale(languages, locales, i18n.defaultLocale);
  } catch (e) {
    return i18n.defaultLocale;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isExcluded = [
    '/api',
    '/auth',
    '/_next',
    '/favicon.ico',
    '/images',
  ].some((path) => pathname.startsWith(path));

  // Determine Locale
  let currentLocale = i18n.defaultLocale;
  const localeMatch = pathname.match(/^\/([^/]+)/);
  if (localeMatch && (i18n.locales as readonly string[]).includes(localeMatch[1] as any)) {
      currentLocale = localeMatch[1] as any;
  } else if (!isExcluded) {
      currentLocale = getLocale(request) as any;
  }

  // --- Rate Limiting Logic ---
  if (redis) {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    
    try {
      if (pathname.startsWith('/api/')) {
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
  })

  // 2. Supabase Auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            }
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. i18n Redirection
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

  // 4. Auth Protection (Handling [lang] prefix)
  const isEscritorio = /^(\/[a-z]{2})?\/escritorio/.test(pathname);
  const isLogin = /^(\/[a-z]{2})?\/login$/.test(pathname);

  if (!user && isEscritorio) {
    const url = request.nextUrl.clone()
    url.pathname = `/${currentLocale}/login`;
    return NextResponse.redirect(url)
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = `/${currentLocale}/escritorio`;
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
