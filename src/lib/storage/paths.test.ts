import { describe, it, expect } from 'vitest';
import {
  buildStoragePath,
  extractBucketAndPathFromUrl,
  extractStoragePathFromUrl,
  extractInlineStoragePaths,
} from './paths';

describe('Storage paths utilities', () => {
  describe('buildStoragePath', () => {
    it('builds entity-grouped avatar path under users/{userId}/ with timestamp and slug', () => {
      const path = buildStoragePath('profile_avatar', 'usr-123', 'webp');
      expect(path).toMatch(/^users\/usr-123\/avatar-\d+-[a-z0-9]{6}\.webp$/);
    });

    it('builds entity-grouped publication cover path under publications/{publicationId}/', () => {
      const path = buildStoragePath('publication_cover', 'pub-456', 'webp');
      expect(path).toMatch(/^publications\/pub-456\/cover-\d+-[a-z0-9]{6}\.webp$/);
    });

    it('builds entity-grouped inline image path under publications/{publicationId}/inline/ using cleaned original filename', () => {
      const path = buildStoragePath('publication_inline', 'pub-456', 'webp', 'My Special Image! 2026.png');
      expect(path).toMatch(/^publications\/pub-456\/inline\/my_special_image_2026-\d+-[a-z0-9]{6}\.webp$/);
    });

    it('handles empty or whitespace-only entity id by falling back to general', () => {
      const path = buildStoragePath('profile_avatar', '   ', 'webp');
      expect(path).toMatch(/^users\/general\/avatar-\d+-[a-z0-9]{6}\.webp$/);
    });
  });

  describe('extractBucketAndPathFromUrl', () => {
    it('extracts bucket and path from entity-grouped media URLs', () => {
      expect(
        extractBucketAndPathFromUrl(
          'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/users/usr-1/avatar-123-abc123.webp'
        )
      ).toEqual({
        bucket: 'media',
        path: 'users/usr-1/avatar-123-abc123.webp',
      });

      expect(
        extractBucketAndPathFromUrl(
          'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-1/cover-123-abc123.webp'
        )
      ).toEqual({
        bucket: 'media',
        path: 'publications/pub-1/cover-123-abc123.webp',
      });

      expect(
        extractBucketAndPathFromUrl(
          'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-1/inline/fig-123-abc123.webp'
        )
      ).toEqual({
        bucket: 'media',
        path: 'publications/pub-1/inline/fig-123-abc123.webp',
      });
    });

    it('strips query parameters and url hashes from path', () => {
      const url = 'https://supabase.co/storage/v1/object/public/media/users/u1/avatar.webp?v=123#fragment';
      const result = extractBucketAndPathFromUrl(url);
      expect(result?.path).toBe('users/u1/avatar.webp');
    });

    it('recognizes canonical entity-grouped relative storage path strings', () => {
      expect(extractBucketAndPathFromUrl('users/usr-1/avatar.webp')).toEqual({
        bucket: 'media',
        path: 'users/usr-1/avatar.webp',
      });
      expect(extractBucketAndPathFromUrl('publications/pub-1/inline/fig.webp')).toEqual({
        bucket: 'media',
        path: 'publications/pub-1/inline/fig.webp',
      });
      expect(extractBucketAndPathFromUrl('_orphans/media/old.webp')).toEqual({
        bucket: 'media',
        path: '_orphans/media/old.webp',
      });
    });

    it('returns null for legacy buckets, legacy folders, and unrecognized or non-string URLs', () => {
      expect(extractBucketAndPathFromUrl(null)).toBeNull();
      expect(extractBucketAndPathFromUrl('')).toBeNull();
      expect(extractBucketAndPathFromUrl('https://example.com/other/asset.png')).toBeNull();
      expect(
        extractBucketAndPathFromUrl(
          'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/cover-old.webp'
        )
      ).toBeNull();
      expect(extractBucketAndPathFromUrl('profiles/usr-1/avatar.webp')).toBeNull();
      expect(extractBucketAndPathFromUrl('portadas/usr-1/cover.webp')).toBeNull();
    });
  });

  describe('extractStoragePathFromUrl', () => {
    it('returns only the path portion from a recognized URL', () => {
      const url = 'https://xyz.supabase.co/storage/v1/object/public/media/publications/pub-1/inline/fig.webp';
      expect(extractStoragePathFromUrl(url)).toBe('publications/pub-1/inline/fig.webp');
    });
  });

  describe('extractInlineStoragePaths', () => {
    it('finds and dedupes canonical inline image paths from HTML body', () => {
      const html = `
        <div>
          <p>Some text</p>
          <img src="https://xyz.supabase.co/storage/v1/object/public/media/publications/pub-1/inline/fig1.webp" alt="Fig 1" />
          <p>Middle</p>
          <img src="https://xyz.supabase.co/storage/v1/object/public/media/publications/pub-1/inline/fig1.webp" alt="Fig 1 duplicate" />
          <img src="https://xyz.supabase.co/storage/v1/object/public/media/publications/pub-1/inline/fig2.webp" alt="Fig 2" />
          <img src="https://external.com/photo.jpg" alt="External image" />
        </div>
      `;
      const paths = extractInlineStoragePaths(html);
      expect(paths).toEqual([
        'publications/pub-1/inline/fig1.webp',
        'publications/pub-1/inline/fig2.webp',
      ]);
    });

    it('returns empty array for empty HTML', () => {
      expect(extractInlineStoragePaths('')).toEqual([]);
      expect(extractInlineStoragePaths(null)).toEqual([]);
    });
  });
});
