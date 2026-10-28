import {
  type StorageCategory,
  STORAGE_BUCKET,
  STORAGE_FOLDERS,
  LEGACY_STORAGE_FOLDERS,
  LEGACY_STORAGE_BUCKETS,
} from './constants';

/**
 * Returns up to six base-36 characters from Math.random() for a filename suffix;
 * the suffix is neither cryptographically secure nor guaranteed to be unique.
 */
function generateShortSlug(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Builds a category-specific path with a millisecond timestamp and random suffix.
 * Trims `userId`, using `general` when empty. Only inline image names use
 * `originalFilename`, cleaning and truncating its stem to at most 24 characters.
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
 * Extracts a recognized bucket marker and its following path, stripping query
 * and fragment suffixes. Also accepts canonical or legacy folder-relative paths,
 * assigning them to `media`. Returns null for empty or unrecognized input.
 * Matching is based on string markers; URL origin and ownership are not validated.
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
 * Returns only the path from a recognized bucket URL or supported relative path,
 * stripping query and fragment suffixes. Returns null for unrecognized input;
 * URL origin and ownership are not validated.
 */
export function extractStoragePathFromUrl(url: string | null | undefined): string | null {
  const result = extractBucketAndPathFromUrl(url);
  return result ? result.path : null;
}

/**
 * Extracts unique recognized storage paths from quoted img src attributes in HTML,
 * including legacy URLs and supported relative paths. Bucket identities are discarded;
 * empty input or no recognized images returns an empty array.
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

export const LEGACY_STORAGE_HOST = 'pzupxjsprmuudmvhzpxu.supabase.co';
export const CURRENT_STORAGE_HOST = 'srbrnpbtfmilohkicpbb.supabase.co';

/**
 * Rewrites legacy Supabase storage hostnames to the current hostname while
 * preserving protocol, path, port, and query parameters.
 * Only modifies the hostname when it matches the legacy host.
 * Returns null for null/undefined/empty input.
 */
export function sanitizeStorageUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === LEGACY_STORAGE_HOST) {
      parsed.hostname = CURRENT_STORAGE_HOST;
      return parsed.toString();
    }
    return url;
  } catch {
    // Relative or protocol-relative fallback
    if (url.includes(LEGACY_STORAGE_HOST)) {
      return url.replace(LEGACY_STORAGE_HOST, CURRENT_STORAGE_HOST);
    }
    return url;
  }
}
