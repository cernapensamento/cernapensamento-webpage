import glDict from './gl.json';
import esDict from './es.json';
import type { Locale } from '@/i18n-config';

export const dictionaries = {
  gl: glDict,
  es: esDict,
};

export function getDictionaryClient(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.gl;
}
