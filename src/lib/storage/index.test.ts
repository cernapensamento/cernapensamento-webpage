import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadStorageImage, removeStorageImages, cleanupPublicationImages } from './index';

vi.mock('./compress', () => ({
  compressImageClient: vi.fn(async () => ({
    blob: new Blob(['fake-data'], { type: 'image/webp' }),
    format: 'webp' as const,
    width: 800,
    height: 600,
    extension: 'webp' as const,
  })),
}));

describe('Storage index module', () => {
  let mockUpload: ReturnType<typeof vi.fn>;
  let mockRemove: ReturnType<typeof vi.fn>;
  let mockGetPublicUrl: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockUpload = vi.fn().mockResolvedValue({ data: { path: 'publications/covers/u1/cover.webp' }, error: null });
    mockRemove = vi.fn().mockResolvedValue({ data: [], error: null });
    mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://supabase.co/storage/v1/object/public/media/publications/covers/u1/cover.webp' },
    });

    mockFrom = vi.fn().mockReturnValue({
      upload: mockUpload,
      remove: mockRemove,
      getPublicUrl: mockGetPublicUrl,
    });

    mockSupabase = {
      storage: {
        from: mockFrom,
      },
    } as unknown as SupabaseClient;
  });

  describe('uploadStorageImage', () => {
    it('uploads compressed image without deleting previousUrl', async () => {
      const file = new File(['image-content'], 'test.png', { type: 'image/png' });

      const result = await uploadStorageImage({
        supabase: mockSupabase,
        file,
        category: 'publication_cover',
        userId: 'u1',
        previousUrl: 'https://supabase.co/storage/v1/object/public/media/publications/covers/u1/old.webp',
      });

      expect(result.publicUrl).toBe(
        'https://supabase.co/storage/v1/object/public/media/publications/covers/u1/cover.webp'
      );
      expect(mockUpload).toHaveBeenCalledTimes(1);
      // Crucial: previousUrl cleanup must NOT be invoked inside uploadStorageImage
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('throws INVALID_FORMAT on unsupported MIME type', async () => {
      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

      await expect(
        uploadStorageImage({
          supabase: mockSupabase,
          file,
          category: 'publication_cover',
          userId: 'u1',
        })
      ).rejects.toThrow('INVALID_FORMAT');
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
