/**
 * Storage Constants & Optimization Presets
 * Defines bucket identifier, standardized domain folders, and client-side compression profiles.
 */

export const STORAGE_BUCKET = 'media' as const;

export const STORAGE_CATEGORIES = {
  PROFILE_AVATAR: 'profile_avatar',
  PUBLICATION_COVER: 'publication_cover',
  PUBLICATION_INLINE: 'publication_inline',
} as const;

export type StorageCategory = (typeof STORAGE_CATEGORIES)[keyof typeof STORAGE_CATEGORIES];

export const STORAGE_FOLDERS: Record<StorageCategory, string> = {
  [STORAGE_CATEGORIES.PROFILE_AVATAR]: 'users',
  [STORAGE_CATEGORIES.PUBLICATION_COVER]: 'publications',
  [STORAGE_CATEGORIES.PUBLICATION_INLINE]: 'publications',
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export interface StorageCompressionPreset {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  outputMimeType: 'image/webp' | 'image/jpeg';
  maxInputBytes: number;
  fit: 'cover' | 'inside';
}

export const STORAGE_PRESETS: Record<StorageCategory, StorageCompressionPreset> = {
  [STORAGE_CATEGORIES.PROFILE_AVATAR]: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
    outputMimeType: 'image/webp',
    maxInputBytes: 5 * 1024 * 1024, // 5 MB
    fit: 'cover',
  },
  [STORAGE_CATEGORIES.PUBLICATION_COVER]: {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 0.82,
    outputMimeType: 'image/webp',
    maxInputBytes: 8 * 1024 * 1024, // 8 MB
    fit: 'inside',
  },
  [STORAGE_CATEGORIES.PUBLICATION_INLINE]: {
    maxWidth: 1400,
    maxHeight: 1400,
    quality: 0.82,
    outputMimeType: 'image/webp',
    maxInputBytes: 8 * 1024 * 1024, // 8 MB
    fit: 'inside',
  },
};

export const STORAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable' as const;

/**
 * Raw file size threshold (~3.5 MB) above which the browser pre-resizes/compresses
 * before POSTing to `/api/storage/upload` to stay comfortably under Vercel Hobby's 4.5 MB ceiling.
 */
export const CLIENT_PRE_RESIZE_BYTES_THRESHOLD = Math.round(3.5 * 1024 * 1024);

/**
 * High-quality JPEG fallback quality used on browsers without canvas WebP encoding (Safari/iOS)
 * before server-side `sharp` converts the payload to WebP.
 */
export const CLIENT_JPEG_FALLBACK_QUALITY = 0.92 as const;
