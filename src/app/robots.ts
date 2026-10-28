import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/escritorio',
        '/escritorio/',
        '/gl/escritorio',
        '/gl/escritorio/',
        '/es/escritorio',
        '/es/escritorio/',
        '/api/',
        '/auth/',
      ],
    },
    sitemap: 'https://cernapensamento.org/sitemap.xml',
  };
}
