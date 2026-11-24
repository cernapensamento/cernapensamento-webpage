import { i18n, isSupportedLocale, type Locale } from '@/i18n-config';
import type { LocalizedString } from '@/lib/db/types';

export type PublicationLanguageMode = 'bilingual' | 'monolingual';

export interface PublicationLanguageSource {
  title?: LocalizedString | Record<string, unknown> | null;
  content?: LocalizedString | Record<string, unknown> | null;
  original_language?: string | null;
}

export interface ResolvedPublicationLocale {
  actualLocale: Locale;
  availableLocales: Locale[];
  isMonolingual: boolean;
  isFallback: boolean;
}

const MEANINGFUL_MEDIA_OR_BLOCK_PATTERN =
  /<(img|iframe|video|audio|figure|table|svg|math)\b|data-type=["']math["']|class=["'][^"']*\bkatex\b[^"']*["']/i;

/**
 * Returns true if an HTML string contains meaningful body content:
 * non-whitespace text or non-text media/blocks (images, embeds, math, tables, figures).
 * Empty editor markup such as `<p></p>`, `<p><br></p>`, or `<p>&nbsp;</p>` returns false.
 */
export function hasMeaningfulHtmlContent(html?: string | null): boolean {
  if (!html || typeof html !== 'string') return false;
  if (MEANINGFUL_MEDIA_OR_BLOCK_PATTERN.test(html)) return true;

  const plainText = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

  return plainText.length > 0;
}

function hasNonEmptyText(
  map: LocalizedString | Record<string, unknown> | null | undefined,
  locale: Locale
): boolean {
  if (!map || typeof map !== 'object') return false;
  const val = (map as Record<string, unknown>)[locale];
  return typeof val === 'string' && val.trim().length > 0;
}

function hasLocaleContent(
  map: LocalizedString | Record<string, unknown> | null | undefined,
  locale: Locale
): boolean {
  if (!map || typeof map !== 'object') return false;
  const val = (map as Record<string, unknown>)[locale];
  return typeof val === 'string' && hasMeaningfulHtmlContent(val);
}

/**
 * Computes the ordered list of supported locales available for a publication.
 * Works on listing rows (title only) as well as full rows (title + content).
 */
export function getAvailablePublicationLocales(
  publication: PublicationLanguageSource
): Locale[] {
  return i18n.locales.filter(
    (loc) =>
      hasNonEmptyText(publication.title, loc) ||
      hasLocaleContent(publication.content, loc)
  );
}

/**
 * Returns true when the publication is available in exactly one supported locale.
 */
export function isMonolingualPublication(
  publication: PublicationLanguageSource
): boolean {
  return getAvailablePublicationLocales(publication).length === 1;
}

/**
 * Returns true when the publication is available in all configured supported locales.
 */
export function isBilingualPublication(
  publication: PublicationLanguageSource
): boolean {
  return getAvailablePublicationLocales(publication).length >= i18n.locales.length;
}

/**
 * Derives the editor language mode (`monolingual` vs `bilingual`) from stored JSONB keys.
 */
export function getPublicationLanguageMode(
  publication: PublicationLanguageSource
): PublicationLanguageMode {
  return isMonolingualPublication(publication) ? 'monolingual' : 'bilingual';
}

/**
 * Resolves the effective locale to render for a publication given a requested route locale,
 * indicating whether the publication is monolingual and whether rendering is falling back.
 */
export function resolvePublicationLocale(
  publication: PublicationLanguageSource,
  requestedLocale: Locale
): ResolvedPublicationLocale {
  const availableLocales = getAvailablePublicationLocales(publication);
  const isMonolingual = availableLocales.length === 1;

  if (availableLocales.includes(requestedLocale)) {
    return {
      actualLocale: requestedLocale,
      availableLocales,
      isMonolingual,
      isFallback: false,
    };
  }

  const origLang =
    publication.original_language && isSupportedLocale(publication.original_language)
      ? publication.original_language
      : null;

  const actualLocale: Locale =
    (origLang && availableLocales.includes(origLang) ? origLang : null) ??
    availableLocales[0] ??
    origLang ??
    i18n.defaultLocale;

  return {
    actualLocale,
    availableLocales,
    isMonolingual,
    isFallback: availableLocales.length > 0,
  };
}
