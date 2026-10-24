import {
  type StorageCategory,
  STORAGE_BUCKET,
  STORAGE_FOLDERS,
  LEGACY_STORAGE_FOLDERS,
  LEGACY_STORAGE_BUCKETS,
} from './constants';

/**
 * Generates an unguessable 6-character alphanumeric slug for deduplication.
 */
function generateShortSlug(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Generates a structured storage path matching the canonical domain hierarchy.
 */
export function buildStoragePath(
  category: StorageCategory,
  userId: string,
  extension: 'webp' | 'jpeg' = 'webp',
  originalFilename?: string
): string {
  const folder = STORAGE_FOLDERS[category];
  const timestamp = Date.now();
  const slug = generateShortSlug();

  const safeUserId = userId.trim() || 'general';

  if (category === 'profile_avatar') {
    return `${folder}/${safeUserId}/avatar-${timestamp}-${slug}.${extension}`;
  }

  if (category === 'publication_cover') {
    return `${folder}/${safeUserId}/cover-${timestamp}-${slug}.${extension}`;
  }

  // Publication inline image
  let safeBase = 'figure';
  if (originalFilename) {
    const rawName = originalFilename.split('.')[0] || '';
    const clean = rawName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 24);
    if (clean) safeBase = clean;
  }

  return `${folder}/${safeUserId}/${safeBase}-${timestamp}-${slug}.${extension}`;
}

/**
 * Extracts the storage object path (e.g. "profiles/123/avatar.webp") from any
 * public Supabase URL (cloud, local Docker stack, or custom domain).
 * Returns null if the URL does not belong to the target storage bucket.
 */
/**
 * Extracts both the bucket identifier and relative storage path from any
 * public Supabase URL (cloud, local Docker stack, or custom domain).
 */
export function extractBucketAndPathFromUrl(
  url: string | null | undefined
): { bucket: string; path: string } | null {
  if (!url || typeof url !== 'string') return null;

  const allBuckets = [STORAGE_BUCKET, ...LEGACY_STORAGE_BUCKETS];
  for (const bucket of allBuckets) {
    const bucketMarker = `${bucket}/`;
    const markerIndex = url.indexOf(bucketMarker);
    if (markerIndex !== -1) {
      const afterMarker = url.substring(markerIndex + bucketMarker.length);
      const cleanPath = afterMarker.split('?')[0].split('#')[0];
      if (cleanPath) {
        return { bucket, path: cleanPath };
      }
    }
  }

  // If already a relative path inside the bucket
  const validFolders = [
    'profiles/',
    'publications/',
    ...LEGACY_STORAGE_FOLDERS.map((f) => `${f}/`),
  ];
  if (validFolders.some((f) => url.startsWith(f))) {
    return { bucket: STORAGE_BUCKET, path: url.split('?')[0].split('#')[0] };
  }

  return null;
}

/**
 * Extracts the storage object path (e.g. "profiles/123/avatar.webp") from any
 * public Supabase URL (cloud, local Docker stack, or custom domain).
 * Returns null if the URL does not belong to a recognized storage bucket.
 */
export function extractStoragePathFromUrl(url: string | null | undefined): string | null {
  const result = extractBucketAndPathFromUrl(url);
  return result ? result.path : null;
}

/**
 * Scans an HTML body (e.g. from TipTap editor) and extracts all unique relative
 * storage paths pointing to images in the application's storage bucket.
 * Supports cloud, local Docker stack, and custom domains.
 */
export function extractInlineStoragePaths(html: string | null | undefined): string[] {
  if (!html || typeof html !== 'string') return [];

  // Match any src attribute containing the storage bucket path
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  const paths = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    const path = extractStoragePathFromUrl(src);
    if (path) {
      paths.add(path);
    }
  }

  return Array.from(paths);
}
