/**
 * Unified, deterministic date formatting utilities for Cerna Pensamento.
 *
 * Ensures identical SSR and client hydration output across all browsers,
 * operating systems, and locales, without relying on client browser ICU database support
 * for Galician ('gl-ES') or Spanish ('es-ES').
 */

export const GL_SHORT_MONTHS = [
  'xan.', 'feb.', 'mar.', 'abr.', 'maio', 'xuño',
  'xul.', 'ago.', 'set.', 'out.', 'nov.', 'dec.',
] as const;

export const ES_SHORT_MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sept', 'oct', 'nov', 'dic',
] as const;

export const GL_LONG_MONTHS = [
  'xaneiro', 'febreiro', 'marzo', 'abril', 'maio', 'xuño',
  'xullo', 'agosto', 'setembro', 'outubro', 'novembro', 'decembro',
] as const;

export const ES_LONG_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

export interface FormatArticleDateOptions {
  format?: 'short' | 'long';
}

/**
 * Formats a date using UTC calendar fields and Galician or Spanish month names.
 * Numeric inputs are milliseconds since the Unix epoch. Falsy inputs (including
 * timestamp 0) and invalid dates return an empty string. Locale codes beginning
 * with "es" (case-insensitive) use Spanish; all others use Galician.
 * Defaults to the short format; `format: 'long'` uses full month names.
 *
 * Examples:
 * - formatArticleDate('2026-10-26T19:18:26Z', 'gl', { format: 'short' }) => "26 de out. de 2026"
 * - formatArticleDate('2026-10-26T19:18:26Z', 'es', { format: 'short' }) => "26 oct 2026"
 * - formatArticleDate('2026-10-26T19:18:26Z', 'gl', { format: 'long' }) => "26 de outubro de 2026"
 * - formatArticleDate('2026-10-26T19:18:26Z', 'es', { format: 'long' }) => "26 de octubre de 2026"
 */
export function formatArticleDate(
  dateInput: string | Date | number | null | undefined,
  lang: string = 'gl',
  options: FormatArticleDateOptions = {}
): string {
  if (!dateInput) return '';

  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';

  const format = options.format || 'short';
  const isEs = lang.toLowerCase().startsWith('es');

  const day = d.getUTCDate();
  const monthIdx = d.getUTCMonth();
  const year = d.getUTCFullYear();

  if (monthIdx < 0 || monthIdx > 11) return '';

  if (format === 'long') {
    const month = isEs ? ES_LONG_MONTHS[monthIdx] : GL_LONG_MONTHS[monthIdx];
    return `${day} de ${month} de ${year}`;
  }

  // Short format
  if (isEs) {
    const month = ES_SHORT_MONTHS[monthIdx];
    return `${day} ${month} ${year}`;
  }

  const month = GL_SHORT_MONTHS[monthIdx];
  return `${day} de ${month} de ${year}`;
}
