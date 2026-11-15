import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublishedAuthors } from './users';

const author = { id: 'author-1', full_name: 'First Author', slug: 'first', role: 'member', bio: null, avatar_url: null };
const publication = {
  id: 'pub-1', slug: 'latest', title: { gl: 'Latest' }, type: 'article',
  created_at: '2026-10-01T00:00:00Z', author_id: author.id, author,
};

describe('published author pagination', () => {
  it('aggregates all pages across pagination', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({ ...publication, id: `pub-${index}` }));
    const secondPage = [
      { ...publication, type: 'essay', created_at: '2026-09-01T00:00:00Z', slug: 'older' },
      { ...publication, author: { ...author, id: 'author-2', slug: 'second' } },
    ];
    const range = vi.fn()
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({ data: secondPage, error: null });
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range,
    };
    const client = { from: vi.fn(() => query) } as unknown as SupabaseClient;

    const result = await getPublishedAuthors(client);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'author-1', published_count: 1001, latest_publication_slug: 'latest',
      publication_types: ['article', 'essay'],
    });
    expect(result[1]).toMatchObject({ id: 'author-2', slug: 'second', published_count: 1 });
    expect(range).toHaveBeenLastCalledWith(1000, 1999);
    expect(range).toHaveBeenCalledTimes(2);
    expect(query.select.mock.calls.flat().join('')).not.toContain('content');
  });

  it('requests the empty final page when the row count is an exact multiple', async () => {
    const range = vi.fn()
      .mockResolvedValueOnce({ data: Array.from({ length: 1000 }, () => publication), error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range,
    };
    const client = { from: vi.fn(() => query) } as unknown as SupabaseClient;
    expect((await getPublishedAuthors(client))[0].published_count).toBe(1000);
    expect(range).toHaveBeenLastCalledWith(1000, 1999);
  });
});
