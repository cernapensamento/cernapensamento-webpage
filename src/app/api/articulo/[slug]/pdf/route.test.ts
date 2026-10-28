import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getPublicationBySlug } from '@/lib/db/queries/publications';
import { buildArticlePdf } from '@/lib/pdf/articlePdf';
import { PUBLICATION_STATUSES } from '@/lib/db/schema';
import type { PublicationDetail } from '@/lib/db/types';

vi.mock('@/lib/db/queries/publications', () => ({
  getPublicationBySlug: vi.fn(),
}));

vi.mock('@/lib/pdf/articlePdf', () => ({
  buildArticlePdf: vi.fn(),
}));

vi.mock('@/dictionaries', () => ({
  getDictionary: vi.fn().mockResolvedValue({
    documentTypes: { essay: 'Ensaio' },
    article: { aboutAuthor: 'Sobre a autoría' },
    authors: {},
  }),
}));

describe('PDF Export API Route (GET /api/articulo/[slug]/pdf)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when publication does not exist', async () => {
    vi.mocked(getPublicationBySlug).mockResolvedValueOnce(null);

    const request = new Request('https://cernapensamento.org/api/articulo/non-existent/pdf');
    const response = await GET(request, {
      params: Promise.resolve({ slug: 'non-existent' }),
    });

    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toBe('Artigo non atopado');
  });

  it('returns 404 when publication is in draft status', async () => {
    vi.mocked(getPublicationBySlug).mockResolvedValueOnce({
      id: 'pub-draft',
      slug: 'draft-article',
      status: PUBLICATION_STATUSES.DRAFT,
      title: { gl: 'Borrador' },
      subtitle: null,
      content: { gl: 'Contido' },
      cover_image_url: null,
      type: 'article',
      original_language: 'gl',
      is_pinned: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      author: {
        id: 'user-1',
        full_name: 'Autor Proba',
        slug: 'autor-proba',
        avatar_url: null,
        bio: 'Bio',
      },
      tags: [],
    } as unknown as PublicationDetail);

    const request = new Request('https://cernapensamento.org/api/articulo/draft-article/pdf');
    const response = await GET(request, {
      params: Promise.resolve({ slug: 'draft-article' }),
    });

    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toBe('Artigo non atopado');
    expect(buildArticlePdf).not.toHaveBeenCalled();
  });

  it('returns 404 when publication is in in_review status', async () => {
    vi.mocked(getPublicationBySlug).mockResolvedValueOnce({
      id: 'pub-review',
      slug: 'review-article',
      status: PUBLICATION_STATUSES.IN_REVIEW,
      title: { gl: 'En revisión' },
      subtitle: null,
      content: { gl: 'Contido' },
      cover_image_url: null,
      type: 'essay',
      original_language: 'gl',
      is_pinned: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      author: {
        id: 'user-1',
        full_name: 'Autor Proba',
        slug: 'autor-proba',
        avatar_url: null,
        bio: 'Bio',
      },
      tags: [],
    } as unknown as PublicationDetail);

    const request = new Request('https://cernapensamento.org/api/articulo/review-article/pdf');
    const response = await GET(request, {
      params: Promise.resolve({ slug: 'review-article' }),
    });

    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toBe('Artigo non atopado');
    expect(buildArticlePdf).not.toHaveBeenCalled();
  });

  it('returns 200 with PDF content when publication is published', async () => {
    const mockPdfBytes = new Uint8Array([37, 80, 68, 70]); // %PDF
    vi.mocked(getPublicationBySlug).mockResolvedValueOnce({
      id: 'pub-published',
      slug: 'artigo-publicado',
      status: PUBLICATION_STATUSES.PUBLISHED,
      title: { gl: 'Artigo Publicado', es: 'Artículo Publicado' },
      subtitle: { gl: 'Subtítulo', es: 'Subtítulo' },
      content: { gl: '<p>Texto completo</p>' },
      cover_image_url: null,
      type: 'essay',
      original_language: 'gl',
      is_pinned: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      author: {
        id: 'user-1',
        full_name: 'Autor Proba',
        slug: 'autor-proba',
        avatar_url: null,
        bio: 'Bio do autor',
      },
      tags: [{ id: 't1', slug: 'filosofia', name: 'Filosofía' }],
    } as unknown as PublicationDetail);

    vi.mocked(buildArticlePdf).mockResolvedValueOnce(mockPdfBytes);

    const request = new Request('https://cernapensamento.org/api/articulo/artigo-publicado/pdf?lang=gl');
    const response = await GET(request, {
      params: Promise.resolve({ slug: 'artigo-publicado' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('cerna-artigo-publicado.pdf');
    expect(buildArticlePdf).toHaveBeenCalledTimes(1);
  });

  it('returns 500 with descriptive error text when generation fails', async () => {
    vi.mocked(getPublicationBySlug).mockResolvedValueOnce({
      id: 'pub-published',
      slug: 'artigo-crash',
      status: PUBLICATION_STATUSES.PUBLISHED,
      title: { gl: 'Artigo Crash' },
      subtitle: null,
      content: { gl: '<p>Crash</p>' },
      cover_image_url: null,
      type: 'essay',
      original_language: 'gl',
      is_pinned: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      author: {
        id: 'user-1',
        full_name: 'Autor Proba',
        slug: 'autor-proba',
        avatar_url: null,
        bio: null,
      },
      tags: [],
    } as unknown as PublicationDetail);

    vi.mocked(buildArticlePdf).mockRejectedValueOnce(new Error('PDF generation crash'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = new Request('https://cernapensamento.org/api/articulo/artigo-crash/pdf?lang=gl');
    const response = await GET(request, {
      params: Promise.resolve({ slug: 'artigo-crash' }),
    });

    expect(response.status).toBe(500);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    const text = await response.text();
    expect(text).toBe('Non foi posible xerar o PDF');

    consoleErrorSpy.mockRestore();
  });
});
