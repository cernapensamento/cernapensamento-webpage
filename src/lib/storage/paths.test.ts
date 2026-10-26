import { describe, it, expect } from 'vitest';
import {
  buildStoragePath,
  extractBucketAndPathFromUrl,
  extractStoragePathFromUrl,
  extractInlineStoragePaths,
} from './paths';

describe('Storage paths utilities', () => {
  describe('buildStoragePath', () => {
    it('builds canonical avatar path with user id, timestamp, and slug', () => {
      const path = buildStoragePath('profile_avatar', 'usr-123', 'webp');
      expect(path).toMatch(/^profiles\/usr-123\/avatar-\d+-[a-z0-9]{6}\.webp$/);
    });

    it('builds canonical publication cover path', () => {
      const path = buildStoragePath('publication_cover', 'author-456', 'webp');
      expect(path).toMatch(/^publications\/covers\/author-456\/cover-\d+-[a-z0-9]{6}\.webp$/);
    });

    it('builds inline image path using cleaned original filename', () => {
      const path = buildStoragePath('publication_inline', 'author-456', 'webp', 'My Special Image! 2026.png');
      expect(path).toMatch(/^publications\/inline\/author-456\/my_special_image_2026-\d+-[a-z0-9]{6}\.webp$/);
    });

    it('handles empty or whitespace-only user id by falling back to general', () => {
      const path = buildStoragePath('profile_avatar', '   ', 'webp');
      expect(path).toMatch(/^profiles\/general\/avatar-\d+-[a-z0-9]{6}\.webp$/);
    });
  });

  describe('extractBucketAndPathFromUrl', () => {
    it('extracts bucket and path from Supabase cloud public URL', () => {
      const url = 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/123/cover-1.webp';
      const result = extractBucketAndPathFromUrl(url);
      expect(result).toEqual({
        bucket: 'media',
        path: 'publications/covers/123/cover-1.webp',
      });
    });

    it('extracts bucket and path from legacy bucket URL', () => {
      const url = 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/cover-old.webp';
      const result = extractBucketAndPathFromUrl(url);
      expect(result).toEqual({
        bucket: 'imagenes-articulos',
        path: 'portadas/cover-old.webp',
      });
    });

    it('strips query parameters and url hashes from path', () => {
      const url = 'https://supabase.co/storage/v1/object/public/media/profiles/u1/avatar.webp?v=123#fragment';
      const result = extractBucketAndPathFromUrl(url);
      expect(result?.path).toBe('profiles/u1/avatar.webp');
    });

    it('recognizes relative storage path strings', () => {
      const result = extractBucketAndPathFromUrl('profiles/usr-1/avatar.webp');
      expect(result).toEqual({
        bucket: 'media',
        path: 'profiles/usr-1/avatar.webp',
      });
    });

    it('returns null for unrecognized or non-string URLs', () => {
      expect(extractBucketAndPathFromUrl(null)).toBeNull();
      expect(extractBucketAndPathFromUrl('')).toBeNull();
      expect(extractBucketAndPathFromUrl('https://example.com/other/asset.png')).toBeNull();
    });
  });

  describe('extractStoragePathFromUrl', () => {
    it('returns only the path portion from a recognized URL', () => {
      const url = 'https://xyz.supabase.co/storage/v1/object/public/media/publications/inline/author/fig.webp';
      expect(extractStoragePathFromUrl(url)).toBe('publications/inline/author/fig.webp');
    });
  });

  describe('extractInlineStoragePaths', () => {
    it('finds and dedupes inline image paths from HTML body', () => {
      const html = `
        <div>
          <p>Some text</p>
          <img src="https://xyz.supabase.co/storage/v1/object/public/media/publications/inline/u1/fig1.webp" alt="Fig 1" />
          <p>Middle</p>
          <img src="https://xyz.supabase.co/storage/v1/object/public/media/publications/inline/u1/fig1.webp" alt="Fig 1 duplicate" />
          <img src="https://xyz.supabase.co/storage/v1/object/public/media/publications/inline/u1/fig2.webp" alt="Fig 2" />
          <img src="https://external.com/photo.jpg" alt="External image" />
        </div>
      `;
      const paths = extractInlineStoragePaths(html);
      expect(paths).toEqual([
        'publications/inline/u1/fig1.webp',
        'publications/inline/u1/fig2.webp',
      ]);
    });

    it('returns empty array for empty HTML', () => {
      expect(extractInlineStoragePaths('')).toEqual([]);
      expect(extractInlineStoragePaths(null)).toEqual([]);
    });
  });
});
