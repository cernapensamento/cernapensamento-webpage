import { describe, it, expect, vi, beforeEach } from 'vitest';
import { i18n } from '@/i18n-config';
import { SITE_URL } from '@/lib/constants';
import sitemap from './sitemap';
import type { PublicationCardItem, PublishedAuthorItem } from '@/lib/db/types';

vi.mock('@/lib/db/queries/publications', () => ({
  getPublicationCards: vi.fn(),
}));

vi.mock('@/lib/db/queries/users', () => ({
  getPublishedAuthors: vi.fn(),
}));

import { getPublicationCards } from '@/lib/db/queries/publications';
import { getPublishedAuthors } from '@/lib/db/queries/users';

describe('Sitemap Generator (src/app/sitemap.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates sitemap with core static routes when database is empty', async () => {
    vi.mocked(getPublicationCards).mockResolvedValue([]);
    vi.mocked(getPublishedAuthors).mockResolvedValue([]);

    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(10);
    const urls = entries.map((e) => e.url);

    expect(urls).toContain(SITE_URL);
    for (const locale of i18n.locales) {
      expect(urls).toContain(`${SITE_URL}/${locale}`);
      expect(urls).toContain(`${SITE_URL}/${locale}/articulos`);
      expect(urls).toContain(`${SITE_URL}/${locale}/asociacion`);
      expect(urls).toContain(`${SITE_URL}/${locale}/contacto`);
      expect(urls).toContain(`${SITE_URL}/${locale}/privacidad`);
    }

    // Every entry must have a lastModified date
    for (const entry of entries) {
      expect(entry.lastModified).toBeDefined();
    }
  });

  it('includes published publications and authors dynamically', async () => {
    vi.mocked(getPublicationCards).mockResolvedValue([
      {
        id: 'pub-1',
        slug: 'ensaio-economico',
        updated_at: '2026-03-01T12:00:00Z',
        created_at: '2026-01-01T10:00:00Z',
      } as unknown as PublicationCardItem,
    ]);

    vi.mocked(getPublishedAuthors).mockResolvedValue([
      {
        id: 'author-1',
        slug: 'diego-araujo',
        full_name: 'Diego Araújo',
      } as unknown as PublishedAuthorItem,
    ]);

    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    for (const locale of i18n.locales) {
      expect(urls).toContain(`${SITE_URL}/${locale}/articulo/ensaio-economico`);
      expect(urls).toContain(`${SITE_URL}/${locale}/autor/diego-araujo`);
    }
  });

  it('handles database errors gracefully and still returns static pages', async () => {
    vi.mocked(getPublicationCards).mockRejectedValue(new Error('DB connection failed'));
    vi.mocked(getPublishedAuthors).mockRejectedValue(new Error('DB connection failed'));

    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);
    const urls = entries.map((e) => e.url);
    for (const locale of i18n.locales) {
      expect(urls).toContain(`${SITE_URL}/${locale}`);
    }
  });

  it.each([false, true])('includes pages beyond the first 1,000 publications (full last page: %s)', async (fullLastPage) => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      id: `pub-${index}`, slug: `article-${index}`,
    } as PublicationCardItem));
    vi.mocked(getPublicationCards)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(fullLastPage ? firstPage.map((pub) => ({ ...pub, slug: `${pub.slug}-next` })) : [
        { id: 'last', slug: 'last-article' } as PublicationCardItem,
      ])
      .mockResolvedValue([]);
    vi.mocked(getPublishedAuthors).mockResolvedValue([]);

    const entries = await sitemap();
    const lastSlug = fullLastPage ? 'article-999-next' : 'last-article';
    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining(
        i18n.locales.map((locale) => `${SITE_URL}/${locale}/articulo/${lastSlug}`)
      )
    );
    expect(getPublicationCards).toHaveBeenNthCalledWith(1, expect.objectContaining({ limit: 1000, offset: 0 }));
    expect(getPublicationCards).toHaveBeenNthCalledWith(2, expect.objectContaining({ limit: 1000, offset: 1000 }));
    expect(getPublicationCards).toHaveBeenCalledTimes(fullLastPage ? 3 : 2);
  });

  it('emits URLs and alternates only for available locales on monolingual publications while keeping both for bilingual', async () => {
    vi.mocked(getPublicationCards).mockResolvedValue([
      {
        id: 'pub-gl',
        slug: 'so-galego',
        title: { gl: 'Só en galego' },
        original_language: 'gl',
        created_at: '2026-01-01T10:00:00Z',
      } as unknown as PublicationCardItem,
      {
        id: 'pub-es',
        slug: 'solo-espanol',
        title: { es: 'Solo en español' },
        original_language: 'es',
        created_at: '2026-01-02T10:00:00Z',
      } as unknown as PublicationCardItem,
      {
        id: 'pub-bi',
        slug: 'bilingue',
        title: { gl: 'Bilingüe', es: 'Bilingüe ES' },
        original_language: 'gl',
        created_at: '2026-01-03T10:00:00Z',
      } as unknown as PublicationCardItem,
    ]);
    vi.mocked(getPublishedAuthors).mockResolvedValue([]);

    const entries = await sitemap();

    const glOnlyEntries = entries.filter((e) => e.url.includes('/articulo/so-galego'));
    expect(glOnlyEntries).toHaveLength(1);
    expect(glOnlyEntries[0].url).toBe(`${SITE_URL}/gl/articulo/so-galego`);
    expect(glOnlyEntries[0].alternates?.languages).toEqual({
      gl: `${SITE_URL}/gl/articulo/so-galego`,
    });

    const esOnlyEntries = entries.filter((e) => e.url.includes('/articulo/solo-espanol'));
    expect(esOnlyEntries).toHaveLength(1);
    expect(esOnlyEntries[0].url).toBe(`${SITE_URL}/es/articulo/solo-espanol`);
    expect(esOnlyEntries[0].alternates?.languages).toEqual({
      es: `${SITE_URL}/es/articulo/solo-espanol`,
    });

    const biEntries = entries.filter((e) => e.url.includes('/articulo/bilingue'));
    expect(biEntries).toHaveLength(2);
    expect(biEntries.map((e) => e.url)).toEqual([
      `${SITE_URL}/gl/articulo/bilingue`,
      `${SITE_URL}/es/articulo/bilingue`,
    ]);
    for (const entry of biEntries) {
      expect(entry.alternates?.languages).toEqual({
        gl: `${SITE_URL}/gl/articulo/bilingue`,
        es: `${SITE_URL}/es/articulo/bilingue`,
      });
    }
  });

});
