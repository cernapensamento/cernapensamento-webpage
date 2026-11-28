import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicationCards, getDashboardPublications } from './publications';
import { getPublishedAuthors } from './users';

function createQueryMock(rows: unknown[]) {
  let capturedSelect = '';
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'range', 'in', 'or'];
  for (const method of methods) {
    chain[method] = vi.fn((...args: unknown[]) => {
      if (method === 'select' && typeof args[0] === 'string') {
        capturedSelect = args[0];
      }
      return chain;
    });
  }
  chain.then = (resolve: (val: { data: unknown[]; error: null }) => void) =>
    Promise.resolve({ data: rows, error: null }).then(resolve);

  const client = {
    from: vi.fn(() => chain),
  } as unknown as SupabaseClient;

  return {
    client,
    getSelect: () => capturedSelect,
  };
}

describe('Listing queries original_language metadata & egress guardrail', () => {
  it('getPublicationCards selects original_language without selecting content', async () => {
    const { client, getSelect } = createQueryMock([
      {
        id: 'pub-es-1',
        slug: 'ensayo-es',
        title: { es: 'Ensayo en español' },
        subtitle: { es: 'Subtítulo en español' },
        cover_image_url: null,
        type: 'essay',
        status: 'published',
        original_language: 'es',
        is_pinned: false,
        created_at: '2026-04-01T10:00:00Z',
        updated_at: '2026-04-01T10:00:00Z',
        published_at: '2026-04-01T10:00:00Z',
        author_id: 'author-1',
        author: {
          id: 'author-1',
          full_name: 'Autor Prueba',
          slug: 'autor-prueba',
          avatar_url: null,
        },
        publication_tags: [],
      },
    ]);

    const cards = await getPublicationCards({ client });

    expect(getSelect()).toContain('original_language');
    expect(getSelect()).not.toMatch(/\bcontent\b/);
    expect(cards).toHaveLength(1);
    expect(cards[0].original_language).toBe('es');
  });

  it('getDashboardPublications selects original_language without selecting content', async () => {
    const { client, getSelect } = createQueryMock([
      {
        id: 'draft-es-1',
        slug: 'borrador-es',
        title: { es: 'Borrador en español' },
        subtitle: null,
        cover_image_url: null,
        type: 'article',
        status: 'draft',
        original_language: 'es',
        is_pinned: false,
        created_at: '2026-04-02T10:00:00Z',
        updated_at: '2026-04-02T10:00:00Z',
        published_at: null,
        author_id: 'author-1',
        author: { id: 'author-1', full_name: 'Autor Prueba' },
      },
    ]);

    const items = await getDashboardPublications({ authorId: 'author-1', client });

    expect(getSelect()).toContain('original_language');
    expect(getSelect()).not.toMatch(/\bcontent\b/);
    expect(items).toHaveLength(1);
    expect(items[0].original_language).toBe('es');
  });

  it('getPublishedAuthors selects original_language without selecting content', async () => {
    const { client, getSelect } = createQueryMock([
      {
        id: 'pub-es-2',
        type: 'essay',
        created_at: '2026-04-03T10:00:00Z',
        published_at: '2026-04-03T10:00:00Z',
        slug: 'ensayo-solo-es',
        title: { es: 'Ensayo solo en español' },
        original_language: 'es',
        author_id: 'author-1',
        author: {
          id: 'author-1',
          full_name: 'Autor Prueba',
          slug: 'autor-prueba',
          bio: null,
          avatar_url: null,
          user_roles: [{ role_id: 'member' }],
        },
      },
    ]);

    const authors = await getPublishedAuthors(client);

    expect(getSelect()).toContain('original_language');
    expect(getSelect()).not.toMatch(/\bcontent\b/);
    expect(authors).toHaveLength(1);
    expect(authors[0].latest_publication_original_language).toBe('es');
  });
});
