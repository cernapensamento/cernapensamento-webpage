import { describe, it, expect, vi } from 'vitest';
import { formatDbError } from './formatDbError';
import { getAllTagsWithTranslations } from './queries/tags';
import { getPublicationCards, getPublicationBySlug } from './queries/publications';
import { getColumnists, getPublishedAuthors, getUserById } from './queries/users';
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
