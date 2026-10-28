import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import { getDocument } from '@/lib/content';
import { NextRequest } from 'next/server';
import type { PublicationDetail } from '@/lib/db/types';

vi.mock('@/lib/db/queries/publications', () => ({
  getPublicationBySlug: vi.fn(),
}));

vi.mock('@/lib/content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/content')>();
  return { ...actual, getDocument: vi.fn(actual.getDocument) };
});

import { getPublicationBySlug } from '@/lib/db/queries/publications';

describe('Markdown API Route (/api/markdown)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns homepage markdown when type is home', async () => {
    const request = new NextRequest('https://cernapensamento.org/api/markdown?type=home&lang=gl');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(response.headers.get('Vary')).toContain('Accept');
    const body = await response.text();
    expect(body).toContain('# Cerna Pensamento');
  });

  it('returns 404 markdown when requested article is not found', async () => {
    vi.mocked(getPublicationBySlug).mockResolvedValue(null);

    const request = new NextRequest('https://cernapensamento.org/api/markdown?type=article&slug=nonexistent&lang=gl');
    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(response.headers.get('Vary')).toContain('Accept');
    const body = await response.text();
    expect(body).toContain('404');
    expect(body).toContain('/sitemap.xml');
    expect(body).toContain('/llms.txt');
  });

  it('returns article markdown when article is found', async () => {
    vi.mocked(getPublicationBySlug).mockResolvedValue({
      id: 'pub-1',
      slug: 'ensaio-liberdade',
      title: { gl: 'A Liberdade Individual', es: 'La Libertad Individual' },
      subtitle: { gl: 'Un ensaio sobre o valor', es: 'Un ensayo sobre el valor' },
      content: { gl: '<p>Contido do ensaio filosófico sobre a liberdade.</p>', es: '' },
      type: 'essay',
      status: 'published',
      author: { full_name: 'Diego Araújo', slug: 'diego-araujo' },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    } as unknown as PublicationDetail);

    const request = new NextRequest('https://cernapensamento.org/api/markdown?type=article&slug=ensaio-liberdade&lang=gl');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(response.headers.get('Vary')).toContain('Accept');
    const body = await response.text();
    expect(body).toContain('# A Liberdade Individual');
    expect(body).toContain('Diego Araújo');
    expect(body).toContain('Contido do ensaio');
  });

  it('returns a server error when publication lookup fails', async () => {
    vi.mocked(getPublicationBySlug).mockRejectedValue(new Error('Database unavailable'));
    const response = await GET(new NextRequest('https://cernapensamento.org/api/markdown?type=article&slug=test&lang=es'));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('404');
    expect(getPublicationBySlug).toHaveBeenCalledWith('test', { lang: 'es', throwOnError: true });
  });

  it.each([
    ['https://example.org/wiki/Test_(article)?a=(b)#part', 'https://example.org/wiki/Test_(article)?a=(b)#part'],
    ['https://example.org/a)b(c', 'https://example.org/a)b(c'],
    ['https://example.org/two words', 'https://example.org/two%20words'],
    ['https://example.org/a\\b', 'https://example.org/a%5Cb'],
  ])('preserves the complete link destination %s', async (href, expected) => {
    vi.mocked(getPublicationBySlug).mockResolvedValue({
      slug: 'links', title: { gl: 'Links' }, content: { gl: `<p><a href="${href}"><strong>Read more</strong></a></p>` },
    } as unknown as PublicationDetail);
    const response = await GET(new NextRequest('https://cernapensamento.org/api/markdown?type=article&slug=links&lang=gl'));
    const markdown = await response.text();
    const rendered = renderToStaticMarkup(React.createElement(Markdown, null, markdown));
    expect(rendered).toContain(`href="${expected}"`);
    expect(rendered).toContain('<strong>Read more</strong></a>');
  });

  it.each(['gl', 'es'])('serves only approved legal documents in %s', async (lang) => {
    for (const slug of ['privacidad', 'estatutos']) {
      const response = await GET(new NextRequest(`https://cernapensamento.org/api/markdown?type=legal&slug=${slug}&lang=${lang}`));
      expect(response.status).toBe(200);
      expect(getDocument).toHaveBeenCalledWith(slug, lang);
      expect((await response.text()).length).toBeGreaterThan(20);
    }
  });

  it.each([
    ['coleccion-ensayos', 'gl'], ['../privacidad', 'gl'], ['privacidad', 'en'],
    ['privacidad', '../es'], ['estatutos', '/tmp/es'],
  ])('rejects unapproved legal slug/locale %s / %s before reading', async (slug, lang) => {
    const url = new URL('https://cernapensamento.org/api/markdown');
    url.search = new URLSearchParams({ type: 'legal', slug, lang }).toString();
    const response = await GET(new NextRequest(url));
    expect(response.status).toBe(404);
    expect(getDocument).not.toHaveBeenCalled();
  });

});
