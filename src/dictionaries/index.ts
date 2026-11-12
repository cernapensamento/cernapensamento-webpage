import 'server-only';
import { i18n, isSupportedLocale, type Locale } from '@/i18n-config';
import { deepMerge } from '@/lib/i18n/deepMerge';

export type Dictionary = typeof import('./gl.json');

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  gl: () => import('./gl.json').then((m) => m.default),
  es: () => import('./es.json').then((m) => m.default),
};

export const getDictionary = async (locale?: string | null): Promise<Dictionary> => {
  const target = isSupportedLocale(locale) ? locale : i18n.defaultLocale;
  const defaultDict = await dictionaries[i18n.defaultLocale]();

  if (target === i18n.defaultLocale) {
    return defaultDict;
  }

  const targetDict = await dictionaries[target]();
  return deepMerge(defaultDict, targetDict);
};
