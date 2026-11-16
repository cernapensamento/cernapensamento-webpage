import { i18n } from '@/i18n-config';
import type { LocalizedString } from '@/lib/db/types';

/**
 * Resolves a localized string from a database or domain LocalizedString object.
 *
 * Evaluation order:
 * 1. Requested language `lang` (if non-empty string).
 * 2. Fallback language (default `i18n.defaultLocale` = 'gl').
 * 3. First non-empty string among all available locales.
 * 4. Empty string.
 */
export function resolveLocalizedText(
  value: LocalizedString | Record<string, unknown> | string | null | undefined,
  lang?: string | null,
  fallbackLang: string = i18n.defaultLocale
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  const record = value as Record<string, unknown>;

  if (lang) {
    const direct = record[lang];
    if (typeof direct === 'string' && direct.trim().length > 0) {
      return direct;
    }
  }

  const fallback = record[fallbackLang];
  if (typeof fallback === 'string' && fallback.trim().length > 0) {
    return fallback;
  }

  for (const v of Object.values(record)) {
    if (typeof v === 'string' && v.trim().length > 0) {
      return v;
    }
  }

  return '';
}

/**
 * Resolves an author biography with optional static dictionary overrides taking
 * precedence over the database LocalizedString `bio` field.
 */
export function resolveAuthorBio(
  author: { slug?: string | null; bio?: LocalizedString | Record<string, unknown> | string | null },
  dictAuthors: Record<string, string> | undefined,
  locale: string
): string {
  const dictBio = author.slug && dictAuthors ? dictAuthors[author.slug] : '';
  return dictBio || resolveLocalizedText(author.bio, locale);
}
