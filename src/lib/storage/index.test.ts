import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  uploadStorageImage,
  removeStorageImages,
  cleanupPublicationImages,
  sweepPublicationStorageFolder,
} from './index';
import * as compressModule from './compress';

describe('Storage index module', () => {
  let mockRemove: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSupabase: SupabaseClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRemove = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom = vi.fn().mockReturnValue({
      remove: mockRemove,
    });
    mockSupabase = {
      storage: {
        from: mockFrom,
      },
    } as unknown as SupabaseClient;

    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        publicUrl: 'https://supabase.co/storage/v1/object/public/media/publications/pub-1/cover-123-abc.webp',
        path: 'publications/pub-1/cover-123-abc.webp',
        width: 800,
        height: 600,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('uploadStorageImage', () => {
    it('posts multipart form data to /api/storage/upload without deleting previousUrl', async () => {
      const prepareSpy = vi.spyOn(compressModule, 'prepareImageForUpload');
      const file = new File(['image-content'], 'test.png', { type: 'image/png' });

      const result = await uploadStorageImage({
        supabase: mockSupabase,
        file,
        category: 'publication_cover',
        userId: 'u1',
        publicationId: 'pub-1',
        previousUrl: 'https://supabase.co/storage/v1/object/public/media/publications/pub-1/old.webp',
      });

      expect(prepareSpy).toHaveBeenCalledWith(file, 'publication_cover');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/storage/upload');
      expect(init.method).toBe('POST');
      expect(init.body).toBeInstanceOf(FormData);
      const sentForm = init.body as FormData;
      expect(sentForm.get('category')).toBe('publication_cover');
      expect(sentForm.get('publicationId')).toBe('pub-1');
      expect(sentForm.get('userId')).toBe('u1');

      expect(result).toEqual({
        publicUrl: 'https://supabase.co/storage/v1/object/public/media/publications/pub-1/cover-123-abc.webp',
        path: 'publications/pub-1/cover-123-abc.webp',
        width: 800,
        height: 600,
      });
      // Crucial: previousUrl cleanup must NOT be invoked inside uploadStorageImage
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('throws INVALID_FORMAT on unsupported MIME type without calling fetch', async () => {
      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

      await expect(
        uploadStorageImage({
          file,
          category: 'publication_cover',
          publicationId: 'pub-1',
        })
      ).rejects.toThrow('INVALID_FORMAT');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws FILE_TOO_LARGE when file exceeds category maxInputBytes', async () => {
      const oversized = new File([new Uint8Array(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });

      await expect(
        uploadStorageImage({
          file: oversized,
          category: 'profile_avatar',
          userId: 'u1',
        })
      ).rejects.toThrow('FILE_TOO_LARGE:5');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('surfaces server error messages from /api/storage/upload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'FORBIDDEN' }),
      });

      const file = new File(['img'], 'avatar.png', { type: 'image/png' });
      await expect(
        uploadStorageImage({
          file,
          category: 'profile_avatar',
          userId: 'u1',
        })
      ).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('removeStorageImages', () => {
    it('groups URLs and relative paths by bucket and removes them', async () => {
      await removeStorageImages(mockSupabase, [
        'https://supabase.co/storage/v1/object/public/media/publications/inline/u1/fig1.webp',
        'publications/covers/u1/cover1.webp',
        'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/legacy.webp',
        null,
        undefined,
      ]);

      expect(mockFrom).toHaveBeenCalledWith('media');
      expect(mockFrom).toHaveBeenCalledWith('imagenes-articulos');

      expect(mockRemove).toHaveBeenCalledWith(
        expect.arrayContaining([
          'publications/inline/u1/fig1.webp',
          'publications/covers/u1/cover1.webp',
        ])
      );
      expect(mockRemove).toHaveBeenCalledWith(['portadas/legacy.webp']);
    });
  });

  describe('cleanupPublicationImages', () => {
    it('extracts cover and all inline images across gl and es and deletes them', async () => {
      await cleanupPublicationImages(mockSupabase, {
        coverUrl: 'https://supabase.co/storage/v1/object/public/media/publications/covers/u1/cover.webp',
        contentGl: '<p><img src="https://supabase.co/storage/v1/object/public/media/publications/inline/u1/fig-gl.webp" /></p>',
        contentEs: '<p><img src="https://supabase.co/storage/v1/object/public/media/publications/inline/u1/fig-es.webp" /></p>',
      });

      expect(mockFrom).toHaveBeenCalledWith('media');
      expect(mockRemove).toHaveBeenCalledWith(
        expect.arrayContaining([
          'publications/covers/u1/cover.webp',
          'publications/inline/u1/fig-gl.webp',
          'publications/inline/u1/fig-es.webp',
        ])
      );
    });
  });

  describe('pagination and batched removal', () => {
    it('removeStorageImages chunks deletions in batches of at most 1000 and continues across errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const paths = Array.from({ length: 2050 }, (_, i) => `publications/pub-1/inline/fig-${i}.webp`);

      mockRemove
        .mockResolvedValueOnce({ data: null, error: { message: 'Batch 1 transient error' } })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      await removeStorageImages(mockSupabase, paths);

      expect(mockRemove).toHaveBeenCalledTimes(3);
      expect(mockRemove.mock.calls[0][0]).toHaveLength(1000);
      expect(mockRemove.mock.calls[1][0]).toHaveLength(1000);
      expect(mockRemove.mock.calls[2][0]).toHaveLength(50);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });

    it('sweepPublicationStorageFolder paginates all list pages before removing in batches <= 1000', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const callOrder: string[] = [];

      const rootPage1 = [
        { name: 'cover.webp', id: 'id-cover' },
        { name: 'inline', id: null },
      ];
      const inlinePage1 = Array.from({ length: 1000 }, (_, i) => ({
        name: `fig-${i}.webp`,
        id: `id-${i}`,
      }));
      const inlinePage2 = Array.from({ length: 250 }, (_, i) => ({
        name: `fig-${1000 + i}.webp`,
        id: `id-${1000 + i}`,
      }));

      const mockList = vi.fn().mockImplementation(async (prefix: string, opts: { limit: number; offset: number }) => {
        callOrder.push(`list:${prefix}:${opts.offset}`);
        if (prefix === 'publications/pub-big') {
          return { data: rootPage1, error: null };
        }
        if (prefix === 'publications/pub-big/inline' && opts.offset === 0) {
          return { data: inlinePage1, error: null };
        }
        if (prefix === 'publications/pub-big/inline' && opts.offset === 1000) {
          return { data: inlinePage2, error: null };
        }
        return { data: [], error: null };
      });

      mockRemove = vi.fn().mockImplementation(async (chunk: string[]) => {
        callOrder.push(`remove:${chunk.length}`);
        if (callOrder.filter((c) => c.startsWith('remove:')).length === 1) {
          return { data: null, error: { message: 'Chunk 1 failed' } };
        }
        return { data: [], error: null };
      });

      mockFrom.mockReturnValue({
        list: mockList,
        remove: mockRemove,
      });

      await sweepPublicationStorageFolder(mockSupabase, 'pub-big');

      expect(mockList).toHaveBeenCalledWith('publications/pub-big', { limit: 1000, offset: 0 });
      expect(mockList).toHaveBeenCalledWith('publications/pub-big/inline', { limit: 1000, offset: 0 });
      expect(mockList).toHaveBeenCalledWith('publications/pub-big/inline', { limit: 1000, offset: 1000 });

      // Total valid objects: 1 cover + 1250 inline = 1251 => 2 batches (1000 + 251)
      expect(callOrder).toEqual([
        'list:publications/pub-big:0',
        'list:publications/pub-big/inline:0',
        'list:publications/pub-big/inline:1000',
        'remove:1000',
        'remove:251',
      ]);
      expect(mockRemove).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });
  });
});
