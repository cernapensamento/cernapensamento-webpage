import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicationBySlug } from './publications';

const miss = { data: null, error: null };
const failure = { data: null, error: { code: '08006', message: 'Database unavailable' } };
const missingTable = { data: null, error: { code: 'PGRST205', message: 'Table missing' } };

function clientFor(results: unknown[]) {
  const maybeSingle = vi.fn();
  for (const result of results) maybeSingle.mockResolvedValueOnce(result);
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle,
  };
  const from = vi.fn(() => query);
  return { client: { from } as unknown as SupabaseClient, maybeSingle };
}

describe('publication lookup error propagation', () => {
  it.each([
    ['exact lookup', [failure]],
    ['suffix lookup', [miss, failure]],
    ['legacy lookup', [missingTable, failure]],
    ['legacy suffix lookup', [missingTable, miss, failure]],
  ])('propagates failures from %s when requested', async (_name, results) => {
    const { client } = clientFor(results);
    await expect(getPublicationBySlug('outdated-abc123', { client, throwOnError: true }))
      .rejects.toEqual(failure.error);
  });

  it.each([
    ['exact', [miss]],
    ['suffix', [miss, miss]],
    ['legacy', [missingTable, miss]],
    ['legacy suffix', [missingTable, miss, miss]],
  ])('returns null for a confirmed %s miss in strict mode', async (name, results) => {
    const { client } = clientFor(results);
    const slug = name.includes('suffix') ? 'missing-abc123' : 'missing';
    await expect(getPublicationBySlug(slug, { client, throwOnError: true })).resolves.toBeNull();
  });

  it('does not treat a multiple-row error as a confirmed miss', async () => {
    const error = { code: 'PGRST116', message: 'Multiple rows returned' };
    const { client } = clientFor([{ data: null, error }]);
    await expect(getPublicationBySlug('duplicate', { client, throwOnError: true })).rejects.toEqual(error);
  });

  it('propagates unexpected client exceptions in strict mode', async () => {
    const { client, maybeSingle } = clientFor([]);
    maybeSingle.mockRejectedValue(new Error('Network unavailable'));
    await expect(getPublicationBySlug('test', { client, throwOnError: true })).rejects.toThrow('Network unavailable');
  });
});
