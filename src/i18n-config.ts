export const i18n = {
  defaultLocale: 'gl',
  locales: ['gl', 'es'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
