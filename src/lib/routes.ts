import { isSupportedLocale } from '@/i18n-config';

/**
 * Checks whether a given request pathname is the homepage (with or without locale prefix).
 */
export function isHomepagePath(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return true;
  const segment = clean.split('/')[1];
  return clean.split('/').length === 2 && isSupportedLocale(segment);
}

const STATIC_SYSTEM_PATHS = new Set([
  '/sitemap.xml',
  '/robots.txt',
  '/llms.txt',
  '/favicon.ico',
]);

const SYSTEM_PREFIXES = ['/images/', '/_next/', '/api/', '/auth/'];

const KNOWN_EXACT_ROUTES = new Set([
  '/articulos',
  '/autores',
  '/asociacion',
  '/asociacion/estatutos',
  '/asociacion/coleccion-articulos',
  '/asociacion/coleccion-ensayos',
  '/asociacion/coleccion-narrativa',
  '/asociacion/coleccion-poesia',
  '/noticias',
  '/contacto',
  '/privacidad',
  '/privacy',
  '/about',
  '/contact',
  '/login',
  '/escritorio',
  '/escritorio/nuevo',
  '/escritorio/perfil',
  '/recuperar-password',
  '/actualizar-password',
  '/bad-request',
]);

/**
 * Checks if a given pathname corresponds to a known valid route or resource in Cerna.
 * Returns false for unknown paths, probe URLs, and 404 targets.
 */
export function isKnownPath(pathname: string): boolean {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // 1. Static files and system paths
  if (STATIC_SYSTEM_PATHS.has(cleanPath) || SYSTEM_PREFIXES.some((p) => cleanPath.startsWith(p))) {
    return true;
  }

  // 2. Homepages
  if (isHomepagePath(cleanPath)) {
    return true;
  }

  // 3. Strip locale prefix if present (e.g. /gl/articulos -> /articulos)
  let pathWithoutLocale = cleanPath;
  const firstSegment = cleanPath.split('/')[1];
  if (isSupportedLocale(firstSegment)) {
    pathWithoutLocale = cleanPath.replace(new RegExp(`^/${firstSegment}`), '') || '/';
  }

  if (isHomepagePath(pathWithoutLocale)) {
    return true;
  }

  // 4. Exact application segments
  if (KNOWN_EXACT_ROUTES.has(pathWithoutLocale)) {
    return true;
  }

  // 5. Dynamic routes: /articulo/[slug], /autor/[slug], /escritorio/editar/[slug]
  if (
    /^\/articulo\/[^/]+$/.test(pathWithoutLocale) ||
    /^\/autor\/[^/]+$/.test(pathWithoutLocale) ||
    /^\/escritorio\/editar\/[^/]+$/.test(pathWithoutLocale)
  ) {
    return true;
  }

  return false;
}
