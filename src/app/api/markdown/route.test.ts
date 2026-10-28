import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import type { PublicationDetail } from '@/lib/db/types';

vi.mock('@/lib/db/queries/publications', () => ({
  getPublicationBySlug: vi.fn(),
}));

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
});
