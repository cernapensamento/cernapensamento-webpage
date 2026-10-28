import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getPublicationCards } from '@/lib/db/queries/publications';
import { getPublishedAuthors } from '@/lib/db/queries/users';
import { COLUMNISTS } from '@/lib/columnists';

export const revalidate = 3600;

const SITE_URL = 'https://cernapensamento.org';

function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return undefined;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Root & Localized Homepages
  entries.push({
    url: SITE_URL,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
    alternates: {
      languages: {
        gl: `${SITE_URL}/gl`,
        es: `${SITE_URL}/es`,
      },
    },
  });

  for (const lang of ['gl', 'es'] as const) {
    entries.push({
      url: `${SITE_URL}/${lang}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          gl: `${SITE_URL}/gl`,
          es: `${SITE_URL}/es`,
        },
      },
    });
  }

  // Static Institutional and Editorial Pages
  const staticPages = [
    { path: 'articulos', priority: 0.9, changeFrequency: 'daily' as const },
    { path: 'autores', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: 'asociacion', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: 'asociacion/estatutos', priority: 0.7, changeFrequency: 'yearly' as const },
    { path: 'asociacion/coleccion-articulos', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: 'asociacion/coleccion-ensayos', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: 'asociacion/coleccion-narrativa', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: 'asociacion/coleccion-poesia', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: 'noticias', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: 'contacto', priority: 0.7, changeFrequency: 'yearly' as const },
    { path: 'privacidad', priority: 0.5, changeFrequency: 'yearly' as const },
  ];

  for (const page of staticPages) {
    for (const lang of ['gl', 'es'] as const) {
      entries.push({
        url: `${SITE_URL}/${lang}/${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: {
            gl: `${SITE_URL}/gl/${page.path}`,
            es: `${SITE_URL}/es/${page.path}`,
          },
        },
      });
    }
  }

  const publicClient = getPublicClient();

  // Published Publications
  try {
    const pageSize = 1000;
    const publications = [];
    for (let offset = 0; ; offset += pageSize) {
      const page = await getPublicationCards({ limit: pageSize, offset, client: publicClient });
      publications.push(...page);
      if (page.length < pageSize) break;
    }
    for (const pub of publications) {
      if (!pub.slug) continue;
      const lastMod = pub.updated_at ? new Date(pub.updated_at) : (pub.created_at ? new Date(pub.created_at) : now);
      for (const lang of ['gl', 'es'] as const) {
        entries.push({
          url: `${SITE_URL}/${lang}/articulo/${pub.slug}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.85,
          alternates: {
            languages: {
              gl: `${SITE_URL}/gl/articulo/${pub.slug}`,
              es: `${SITE_URL}/es/articulo/${pub.slug}`,
            },
          },
        });
      }
    }
  } catch (err) {
    console.error('[Sitemap] Failed to fetch dynamic publications for sitemap:', err);
  }

  // Authors & Columnists
  try {
    const authorSlugs = new Set<string>();

    // Add predefined columnists
    for (const columnist of COLUMNISTS) {
      if (columnist.slug) authorSlugs.add(columnist.slug);
    }

    // Add published authors from DB
    const publishedAuthors = await getPublishedAuthors(publicClient);
    for (const item of publishedAuthors) {
      if (item.slug) {
        authorSlugs.add(item.slug);
      }
    }

    for (const slug of authorSlugs) {
      for (const lang of ['gl', 'es'] as const) {
        entries.push({
          url: `${SITE_URL}/${lang}/autor/${slug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.75,
          alternates: {
            languages: {
              gl: `${SITE_URL}/gl/autor/${slug}`,
              es: `${SITE_URL}/es/autor/${slug}`,
            },
          },
        });
      }
    }
  } catch (err) {
    console.error('[Sitemap] Failed to fetch authors for sitemap:', err);
  }

  return entries;
}
