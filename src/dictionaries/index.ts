import 'server-only';
import type { Locale } from '@/i18n-config';

const dictionaries = {
  gl: () => import('./gl.json').then((module) => module.default),
  es: () => import('./es.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) =>
  dictionaries[locale]?.() ?? dictionaries.gl();
