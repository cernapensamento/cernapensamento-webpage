import glDict from './gl.json';
import esDict from './es.json';
import { i18n, isSupportedLocale, type Locale } from '@/i18n-config';
import { deepMerge } from '@/lib/i18n/deepMerge';

export type Dictionary = typeof glDict;

export const dictionaries: Record<string, Dictionary> = {
  gl: glDict,
  es: deepMerge(glDict, esDict),
};

export function getDictionaryClient(locale?: string | Locale | null): Dictionary {
  if (locale && isSupportedLocale(locale)) return dictionaries[locale];
  return dictionaries[i18n.defaultLocale] || glDict;
}
