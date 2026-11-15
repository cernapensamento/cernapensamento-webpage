export const i18n = {
  defaultLocale: 'gl',
  locales: ['gl', 'es'],
  localeLabels: {
    gl: 'Galego',
    es: 'Castellano',
  },
} as const;

export type Locale = (typeof i18n)['locales'][number];

export function isSupportedLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && (i18n.locales as readonly string[]).includes(locale);
}

