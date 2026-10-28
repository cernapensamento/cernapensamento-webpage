import { describe, it, expect, vi } from 'vitest';
import { getPublicationBySlug } from './publications';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('getPublicationBySlug - Suffix Fallback Resolution', () => {
  const canonicalPublication = {
    id: 'd1000000-0000-0000-0000-000000000001',
    slug: 'los-enemigos-de-la-maquina-6m0u1y',
    title: { gl: 'Os inimigos da máquina', es: 'Los enemigos de la máquina' },
    subtitle: null,
    content: { gl: '<p>Contido</p>', es: '<p>Contenido</p>' },
    cover_image_url: 'https://example.com/cover.webp',
    type: 'article',
    status: 'published',
    original_language: 'gl',
    is_pinned: false,
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-06T12:00:00Z',
    author_id: 'u1000000-0000-0000-0000-000000000001',
    author: {
      id: 'u1000000-0000-0000-0000-000000000001',
      full_name: 'Diego Araújo',
      slug: 'diego-araujo',
      avatar_url: null,
      bio: null,
    },
    publication_tags: [],
  };

  it('resolves canonical publication when queried with exact slug', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: canonicalPublication,
              error: null,
            }),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await getPublicationBySlug('los-enemigos-de-la-maquina-6m0u1y', { client: mockClient });
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('los-enemigos-de-la-maquina-6m0u1y');
  });

  it('resolves updated publication by suffix when queried with outdated legacy slug', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
          ilike: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: canonicalPublication,
                error: null,
              }),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await getPublicationBySlug('la-ia-no-te-va-a-quitar-el-trabajo-6m0u1y', { client: mockClient });
    expect(result).not.toBeNull();
    // Result contains the canonical current slug, enabling permanentRedirect
    expect(result?.slug).toBe('los-enemigos-de-la-maquina-6m0u1y');
    expect(result?.title.es).toBe('Los enemigos de la máquina');
  });

  it('returns null when neither exact slug nor suffix matches', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
          ilike: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await getPublicationBySlug('articulo-inexistente-999999', { client: mockClient });
    expect(result).toBeNull();
  });
});
