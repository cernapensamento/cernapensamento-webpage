import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadStorageImage, removeStorageImages, cleanupPublicationImages } from './index';
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
});
