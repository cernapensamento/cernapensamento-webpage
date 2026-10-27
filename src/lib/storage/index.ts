import type { SupabaseClient } from '@supabase/supabase-js';
import {
  STORAGE_BUCKET,
  STORAGE_CACHE_CONTROL,
  STORAGE_PRESETS,
  ALLOWED_IMAGE_MIME_TYPES,
  type StorageCategory,
} from './constants';
import { compressImageClient } from './compress';
import {
  buildStoragePath,
  extractBucketAndPathFromUrl,
  extractInlineStoragePaths,
} from './paths';

export * from './constants';
export * from './compress';
export * from './paths';

export interface UploadStorageImageOptions {
  supabase: SupabaseClient;
  file: File | Blob;
  category: StorageCategory;
  userId: string;
  previousUrl?: string | null;
  originalFilename?: string;
}

export interface UploadStorageImageResult {
  publicUrl: string;
  path: string;
  width: number;
  height: number;
}

/**
 * Validates, compresses, and uploads an image using the category preset, then
 * returns its public URL, path, and dimensions in pixels. WebP is preferred with
 * a JPEG fallback. A recognized `previousUrl` is scheduled for deletion after
 * upload; that deletion is not awaited and its rejection is caught.
 * Rejects with `INVALID_FORMAT` for a nonempty unsupported MIME type or
 * `FILE_TOO_LARGE:<rounded MiB limit>` when the input exceeds its size limit.
 * Compression failures, upload errors, and uncaught storage SDK errors propagate.
 */
export async function uploadStorageImage({
  supabase,
  file,
  category,
  userId,
  previousUrl,
  originalFilename,
}: UploadStorageImageOptions): Promise<UploadStorageImageResult> {
  const preset = STORAGE_PRESETS[category];

  // 1. Validation
  if (file.type && !(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new Error('INVALID_FORMAT');
  }

  if (file.size > preset.maxInputBytes) {
    const maxMb = Math.round(preset.maxInputBytes / (1024 * 1024));
    throw new Error(`FILE_TOO_LARGE:${maxMb}`);
  }

  // 2. Client-side compression & WebP encoding
  const compressed = await compressImageClient(file, category);

  // 3. Structured path generation
  const path = buildStoragePath(
    category,
    userId,
    compressed.extension,
    originalFilename || (file instanceof File ? file.name : undefined)
  );

  // 4. Storage upload with immutable cache headers
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, compressed.blob, {
      contentType: compressed.blob.type,
      cacheControl: STORAGE_CACHE_CONTROL,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  // 5. Cleanup previous asset if superseded
  if (previousUrl) {
    const oldInfo = extractBucketAndPathFromUrl(previousUrl);
    if (oldInfo && (oldInfo.bucket !== STORAGE_BUCKET || oldInfo.path !== path)) {
      supabase.storage
        .from(oldInfo.bucket)
        .remove([oldInfo.path])
        .catch((err) => console.error('Failed to cleanup previous storage image:', err));
    }
  }

  // 6. Public URL resolution
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return {
    publicUrl: urlData.publicUrl,
    path,
    width: compressed.width,
    height: compressed.height,
  };
}

/**
 * Attempts deletion of recognized storage URLs or relative paths, deduplicated
 * per bucket; relative paths use `media`. Empty and unrecognized inputs are skipped.
 * Errors returned by storage are ignored; thrown SDK errors propagate.
 */
export async function removeStorageImages(
  supabase: SupabaseClient,
  urlsOrPaths: (string | null | undefined)[]
): Promise<void> {
  const bucketMap = new Map<string, Set<string>>();

  for (const item of urlsOrPaths) {
    const extracted = extractBucketAndPathFromUrl(item);
    if (extracted) {
      if (!bucketMap.has(extracted.bucket)) {
        bucketMap.set(extracted.bucket, new Set());
      }
      bucketMap.get(extracted.bucket)!.add(extracted.path);
    }
  }

  for (const [bucket, pathSet] of bucketMap.entries()) {
    const paths = Array.from(pathSet);
    if (paths.length > 0) {
      const { error } = await supabase.storage.from(bucket).remove(paths);
      if (error) {
        console.error(`Failed to remove storage images from '${bucket}':`, error.message);
      }
    }
  }
}

/**
 * Attempts deletion of the cover and unique recognized inline image paths from
 * both Galician and Spanish HTML. Inline paths are resolved in `media`; the cover
 * retains its recognized bucket. Returned storage errors are ignored, while
 * thrown SDK errors propagate. Empty input performs no deletions.
 */
export async function cleanupPublicationImages(
  supabase: SupabaseClient,
  {
    coverUrl,
    contentGl,
    contentEs,
  }: {
    coverUrl?: string | null;
    contentGl?: string | null;
    contentEs?: string | null;
  }
): Promise<void> {
  const inlineGl = extractInlineStoragePaths(contentGl);
  const inlineEs = extractInlineStoragePaths(contentEs);

  const allItems = Array.from(
    new Set([...(coverUrl ? [coverUrl] : []), ...inlineGl, ...inlineEs])
  );

  if (allItems.length > 0) {
    await removeStorageImages(supabase, allItems);
  }
}
