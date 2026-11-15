export const i18n = {
  defaultLocale: 'gl',
  locales: ['gl', 'es'],
  localeLabels: {
    gl: 'Galego',
    es: 'Castellano',
  },
  openGraphLocales: {
    gl: 'gl_ES',
    es: 'es_ES',
  },
  translationLanguageNames: {
    gl: 'Galician',
    es: 'Spanish',
  },
} as const;

export type Locale = (typeof i18n)['locales'][number];

export function isSupportedLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && (i18n.locales as readonly string[]).includes(locale);
}

export function resolveLocale(locale: unknown): Locale {
  return isSupportedLocale(locale) ? locale : i18n.defaultLocale;
}

export function getOpenGraphLocale(locale: unknown): string {
  const resolved = resolveLocale(locale);
  return (i18n.openGraphLocales as Record<string, string>)[resolved] || `${resolved}_${resolved.toUpperCase()}`;
}

export function getTranslationLanguageName(locale: string): string {
  const configured = (i18n.translationLanguageNames as Record<string, string>)[locale];
  if (configured) return configured;

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    return displayNames.of(locale) || locale;
  } catch {
    return locale;
  }
}

