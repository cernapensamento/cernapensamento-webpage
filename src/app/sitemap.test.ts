import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    expect(urls).toContain('https://cernapensamento.org');
    expect(urls).toContain('https://cernapensamento.org/gl');
    expect(urls).toContain('https://cernapensamento.org/es');
    expect(urls).toContain('https://cernapensamento.org/gl/articulos');
    expect(urls).toContain('https://cernapensamento.org/gl/asociacion');
    expect(urls).toContain('https://cernapensamento.org/gl/contacto');
    expect(urls).toContain('https://cernapensamento.org/gl/privacidad');

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

    expect(urls).toContain('https://cernapensamento.org/gl/articulo/ensaio-economico');
    expect(urls).toContain('https://cernapensamento.org/es/articulo/ensaio-economico');
    expect(urls).toContain('https://cernapensamento.org/gl/autor/diego-araujo');
    expect(urls).toContain('https://cernapensamento.org/es/autor/diego-araujo');
  });

  it('handles database errors gracefully and still returns static pages', async () => {
    vi.mocked(getPublicationCards).mockRejectedValue(new Error('DB connection failed'));
    vi.mocked(getPublishedAuthors).mockRejectedValue(new Error('DB connection failed'));

    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://cernapensamento.org/gl');
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
    expect(entries.map((entry) => entry.url)).toEqual(expect.arrayContaining([
      `https://cernapensamento.org/gl/articulo/${lastSlug}`,
      `https://cernapensamento.org/es/articulo/${lastSlug}`,
    ]));
    expect(getPublicationCards).toHaveBeenNthCalledWith(1, expect.objectContaining({ limit: 1000, offset: 0 }));
    expect(getPublicationCards).toHaveBeenNthCalledWith(2, expect.objectContaining({ limit: 1000, offset: 1000 }));
    expect(getPublicationCards).toHaveBeenCalledTimes(fullLastPage ? 3 : 2);
  });

});
