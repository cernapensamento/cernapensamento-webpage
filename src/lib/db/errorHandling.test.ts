import { describe, it, expect, vi } from 'vitest';
import { formatDbError, isMissingColumnError } from './formatDbError';
import { getAllTagsWithTranslations } from './queries/tags';
import { getPublicationCards, getPublicationBySlug, getDashboardPublications } from './queries/publications';
import { getColumnists, getPublishedAuthors, getUserById, getUserBySlug, getUserBySlugOrId } from './queries/users';
import { getCommentsForPublication } from './queries/comments';
import { getHomepageData } from './queries/composite';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('formatDbError', () => {
  it('handles null/undefined gracefully', () => {
    expect(formatDbError(null)).toBe('Unknown database error');
    expect(formatDbError(undefined)).toBe('Unknown database error');
  });

  it('handles string errors directly', () => {
    expect(formatDbError('Database down')).toBe('Database down');
  });

  it('formats standard PostgrestError with code, message, and details', () => {
    const error = {
      code: 'PGRST301',
      message: 'JWT expired',
      details: 'token is no longer valid',
      hint: 'refresh your session',
    };
    const formatted = formatDbError(error);
    expect(formatted).toContain('[PGRST301]');
    expect(formatted).toContain('JWT expired');
    expect(formatted).toContain('(token is no longer valid)');
    expect(formatted).toContain('hint: refresh your session');
  });

  it('formats connection failure errors without details duplication', () => {
    const error = {
      message: 'TypeError: fetch failed',
      details: 'TypeError: fetch failed',
      code: '',
    };
    const formatted = formatDbError(error);
    expect(formatted).toBe('TypeError: fetch failed');
  });

  it('formats native Error instances', () => {
    const err = new Error('Socket closed unexpectedly');
    expect(formatDbError(err)).toBe('Socket closed unexpectedly');
  });

  it('does not produce empty "{}" string for empty objects', () => {
    const emptyObj = {};
    const formatted = formatDbError(emptyObj);
    expect(formatted).not.toBe('{}');
    expect(formatted).toBe('[object Object]');
  });
});

describe('DAL Graceful Degradation on Database Disconnection/Failure', () => {
  // Mock a failing Supabase client simulating ECONNREFUSED or network failure
  const failingClient = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'TypeError: fetch failed',
          details: 'connect ECONNREFUSED 127.0.0.1:54322',
          code: '',
        },
      }),
      then: (resolve: (val: unknown) => void) =>
        resolve({
          data: null,
          error: {
            message: 'TypeError: fetch failed',
            details: 'connect ECONNREFUSED 127.0.0.1:54322',
            code: '',
          },
        }),
    })),
  } as unknown as SupabaseClient;

  // Mock an throwing Supabase client simulating unhandled fetch exceptions
  const throwingClient = {
    from: vi.fn(() => {
      throw new Error('Fatal socket failure: network unreachable');
    }),
  } as unknown as SupabaseClient;

  it('getAllTagsWithTranslations returns [] on connection error', async () => {
    const result = await getAllTagsWithTranslations({ client: failingClient });
    expect(result).toEqual([]);
  });

  it('getAllTagsWithTranslations returns [] when client throws an exception', async () => {
    const result = await getAllTagsWithTranslations({ client: throwingClient });
    expect(result).toEqual([]);
  });

  it('getPublicationCards returns [] on connection error', async () => {
    const result = await getPublicationCards({ client: failingClient });
    expect(result).toEqual([]);
  });

  it('getPublicationCards returns [] when client throws an exception', async () => {
    const result = await getPublicationCards({ client: throwingClient });
    expect(result).toEqual([]);
  });

  it('getPublicationBySlug returns null on connection error', async () => {
    const result = await getPublicationBySlug('test-slug', { client: failingClient });
    expect(result).toBeNull();
  });

  it('getPublicationBySlug returns null when client throws an exception', async () => {
    const result = await getPublicationBySlug('test-slug', { client: throwingClient });
    expect(result).toBeNull();
  });

  it('getColumnists returns [] on connection error', async () => {
    const result = await getColumnists(failingClient);
    expect(result).toEqual([]);
  });

  it('getPublishedAuthors returns [] on connection error', async () => {
    const result = await getPublishedAuthors(failingClient);
    expect(result).toEqual([]);
  });

  it('getUserById returns null on connection error', async () => {
    const result = await getUserById('c7b8d6f0-1234-5678-90ab-cdef12345678', failingClient);
    expect(result).toBeNull();
  });

  it('getCommentsForPublication returns [] on connection error', async () => {
    const result = await getCommentsForPublication('pub-123', failingClient);
    expect(result).toEqual([]);
  });

  it('getHomepageData returns empty aggregated structure on connection error', async () => {
    const result = await getHomepageData({ client: failingClient });
    expect(result).toEqual({
      featured: null,
      pinned: [],
      latest: [],
      columnists: [],
    });
  });
});

describe('Schema Skew & Column Privilege Resilience', () => {
  it('isMissingColumnError detects PostgreSQL 42703 and PostgREST PGRST204 for a column', () => {
    expect(isMissingColumnError({ code: '42703', message: 'column publications.published_at does not exist' }, 'published_at')).toBe(true);
    expect(isMissingColumnError({ code: 'PGRST204', message: "Could not find the 'published_at' column" }, 'published_at')).toBe(true);
    expect(isMissingColumnError({ code: '42703', message: 'column other does not exist' }, 'published_at')).toBe(false);
    expect(isMissingColumnError({ code: '42501', message: 'permission denied for published_at' }, 'published_at')).toBe(false);
  });

  function createMissingPublishedAtClient(rows: unknown[]) {
    const selectedColumns: string[] = [];
    const client = {
      from: vi.fn(() => {
        let hasPublishedAt = false;
        const builder = {
          select: vi.fn((cols: string) => {
            selectedColumns.push(cols);
            hasPublishedAt = cols.includes('published_at');
            return builder;
          }),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn((col: string) => {
            if (col === 'published_at') hasPublishedAt = true;
            return builder;
          }),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (val: unknown) => void) =>
            resolve(
              hasPublishedAt
                ? {
                    data: null,
                    error: {
                      code: '42703',
                      message: 'column publications.published_at does not exist',
                    },
                  }
                : { data: rows, error: null }
            ),
        };
        return builder;
      }),
    } as unknown as SupabaseClient;

    return { client, selectedColumns };
  }

  it('getPublicationCards falls back to created_at when published_at is missing', async () => {
    const { client, selectedColumns } = createMissingPublishedAtClient([
      {
        id: 'pub-1',
        slug: 'ensayo-1',
        title: { gl: 'Ensaio', es: 'Ensayo' },
        subtitle: null,
        cover_image_url: null,
        type: 'essay',
        status: 'published',
        is_pinned: false,
        created_at: '2026-10-20T10:00:00Z',
        updated_at: '2026-10-20T10:00:00Z',
        author_id: 'auth-1',
        author: { id: 'auth-1', full_name: 'Diego', slug: 'diego', avatar_url: null },
        publication_tags: [],
      },
    ]);

    const cards = await getPublicationCards({ client });
    expect(cards).toHaveLength(1);
    expect(cards[0].slug).toBe('ensayo-1');
    expect(cards[0].published_at).toBe('2026-10-20T10:00:00Z');
    expect(selectedColumns).toHaveLength(2);
    expect(selectedColumns[0]).toContain('published_at');
    expect(selectedColumns[1]).not.toContain('published_at');
  });

  it('getPublishedAuthors falls back to created_at when published_at is missing', async () => {
    const { client, selectedColumns } = createMissingPublishedAtClient([
      {
        id: 'pub-1',
        type: 'article',
        created_at: '2026-10-20T10:00:00Z',
        slug: 'artigo-1',
        title: { gl: 'Artigo', es: 'Artículo' },
        author_id: 'auth-1',
        author: {
          id: 'auth-1',
          full_name: 'Diego Araújo',
          slug: 'diego-araujo',
          bio: null,
          avatar_url: null,
          role: 'founder',
        },
      },
    ]);

    const authors = await getPublishedAuthors(client);
    expect(authors).toHaveLength(1);
    expect(authors[0].slug).toBe('diego-araujo');
    expect(authors[0].latest_publication_at).toBe('2026-10-20T10:00:00Z');
    expect(selectedColumns).toHaveLength(2);
    expect(selectedColumns[1]).not.toContain('published_at');
  });

  it('getDashboardPublications falls back when published_at is missing', async () => {
    const { client, selectedColumns } = createMissingPublishedAtClient([
      {
        id: 'pub-1',
        slug: 'draft-1',
        title: { gl: 'Borrador', es: 'Borrador' },
        subtitle: null,
        cover_image_url: null,
        type: 'article',
        status: 'draft',
        is_pinned: false,
        created_at: '2026-10-20T10:00:00Z',
        updated_at: '2026-10-20T10:00:00Z',
        author_id: 'auth-1',
        author: { id: 'auth-1', full_name: 'Diego' },
      },
    ]);

    const rows = await getDashboardPublications({ authorId: 'auth-1', client });
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('draft-1');
    expect(selectedColumns).toHaveLength(2);
    expect(selectedColumns[1]).not.toContain('published_at');
  });

  it('public user lookups select only anon-safe columns while getUserById includes newsletter_subscribed', async () => {
    const selectCalls: string[] = [];
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn((cols: string) => {
          selectCalls.push(cols);
          return {
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'u1', full_name: 'Diego', slug: 'diego', bio: null, avatar_url: null, role: 'founder' },
              error: null,
            }),
          };
        }),
      })),
    } as unknown as SupabaseClient;

    await getUserBySlug('diego', mockClient);
    await getUserBySlugOrId('diego', mockClient);
    await getUserById('c7b8d6f0-1234-5678-90ab-cdef12345678', mockClient);

    expect(selectCalls[0]).not.toContain('*');
    expect(selectCalls[0]).not.toContain('newsletter_subscribed');
    expect(selectCalls[1]).not.toContain('*');
    expect(selectCalls[1]).not.toContain('newsletter_subscribed');
    expect(selectCalls[2]).toContain('newsletter_subscribed');
  });
});
