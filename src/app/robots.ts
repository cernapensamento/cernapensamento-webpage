import type { MetadataRoute } from 'next';
import { i18n } from '@/i18n-config';

export default function robots(): MetadataRoute.Robots {
  const localizedDeskPaths = i18n.locales.flatMap((locale) => [
    `/${locale}/escritorio`,
    `/${locale}/escritorio/`,
  ]);

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/escritorio',
        '/escritorio/',
        ...localizedDeskPaths,
        '/api/',
        '/auth/',
      ],
    },
    sitemap: 'https://cernapensamento.org/sitemap.xml',
  };
}
