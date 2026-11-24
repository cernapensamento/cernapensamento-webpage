import { describe, it, expect, vi } from 'vitest';
import { getPublicationById, getPublicationCards } from './publications';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('getPublicationCards published_at ordering and fallback', () => {
  it('orders by published_at with fallback to created_at', async () => {
    const mockRows = [
      {
        id: 'pub-1',
        slug: 'slug-1',
        title: { gl: 'Artigo 1', es: 'Artículo 1' },
        subtitle: null,
        cover_image_url: null,
        type: 'article',
        status: 'published',
        is_pinned: false,
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-11-10T12:00:00Z',
        published_at: '2026-11-10T12:00:00Z',
        author: {
          id: 'user-1',
          full_name: 'Autor 1',
          slug: 'autor-1',
          avatar_url: null,
        },
        publication_tags: [],
      },
      {
        id: 'pub-2',
        slug: 'slug-2',
        title: { gl: 'Artigo 2', es: 'Artículo 2' },
        subtitle: null,
        cover_image_url: null,
        type: 'article',
        status: 'published',
        is_pinned: false,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
        published_at: null,
        author: {
          id: 'user-2',
          full_name: 'Autor 2',
          slug: 'autor-2',
          avatar_url: null,
        },
        publication_tags: [],
      },
    ];

    const orderCalls: Array<{ column: string; options: unknown }> = [];
    const queryBuilder: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation((col, opts) => {
        orderCalls.push({ column: col, options: opts });
        return queryBuilder;
      }),
      range: vi.fn().mockImplementation(() => Promise.resolve({ data: mockRows, error: null })),
    };

    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    } as unknown as SupabaseClient;

    const cards = await getPublicationCards({ client: mockClient });

    expect(orderCalls).toEqual([
      { column: 'published_at', options: { ascending: false, nullsFirst: false } },
      { column: 'created_at', options: { ascending: false } },
      { column: 'id', options: { ascending: false } },
    ]);

    expect(cards).toHaveLength(2);
    // When published_at is set, it's used
    expect(cards[0].published_at).toBe('2026-11-10T12:00:00Z');
    // When published_at is null, it falls back to created_at
    expect(cards[1].published_at).toBe('2026-10-01T10:00:00Z');
  });

  it('keeps published_at null for draft and in_review publications in getPublicationById and getPublicationCards', async () => {
    const draftRow = {
      id: 'pub-draft',
      slug: 'borrador-antigo',
      title: { gl: 'Borrador', es: 'Borrador' },
      subtitle: null,
      content: { gl: '<p>Texto</p>', es: '<p>Texto</p>' },
      cover_image_url: null,
      type: 'article',
      status: 'draft',
      original_language: 'gl',
      is_pinned: false,
      show_index: false,
      created_at: '2026-01-01T10:00:00Z',
      updated_at: '2026-01-01T10:00:00Z',
      published_at: null,
      author_id: 'user-1',
      author: {
        id: 'user-1',
        full_name: 'Autor 1',
        slug: 'autor-1',
        avatar_url: null,
        bio: null,
      },
      publication_tags: [],
    };

    const byIdClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: draftRow, error: null }),
      }),
    } as unknown as SupabaseClient;

    const detail = await getPublicationById('pub-draft', { client: byIdClient });
    expect(detail).not.toBeNull();
    expect(detail!.published_at).toBeNull();

    const cardsClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [draftRow, { ...draftRow, id: 'pub-review', status: 'in_review' }],
          error: null,
        }),
      }),
    } as unknown as SupabaseClient;

    const cards = await getPublicationCards({ client: cardsClient, status: 'draft' });
    expect(cards).toHaveLength(2);
    expect(cards[0].published_at).toBeNull();
    expect(cards[1].published_at).toBeNull();
  });
});
