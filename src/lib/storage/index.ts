import type { SupabaseClient } from '@supabase/supabase-js';
import {
  STORAGE_BUCKET,
  STORAGE_PRESETS,
  ALLOWED_IMAGE_MIME_TYPES,
  type StorageCategory,
} from './constants';
import { prepareImageForUpload } from './compress';
import {
  extractBucketAndPathFromUrl,
  extractInlineStoragePaths,
} from './paths';

export * from './constants';
export * from './compress';
export * from './paths';

export interface UploadStorageImageOptions {
  /**
   * @deprecated Uploads now route through `POST /api/storage/upload` using the server SSR client.
   * Kept optional for backwards compatibility with existing callers.
   */
  supabase?: SupabaseClient;
  file: File | Blob;
  category: StorageCategory;
  userId?: string;
  publicationId?: string;
  /**
   * @deprecated Superseded asset cleanup is now the caller's responsibility after
   * successful persistence (e.g. using `removeStorageImages`). This prevents deleting
   * assets if saving fails or is cancelled.
   */
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
 * Validates, conditionally pre-resizes on the client (when > ~3.5 MB or exceeding
 * category pixel bounds), and uploads an image via `POST /api/storage/upload`.
 * Rejects with `INVALID_FORMAT` for a nonempty unsupported MIME type or
 * `FILE_TOO_LARGE:<rounded MiB limit>` when the input exceeds its size limit.
 */
export async function uploadStorageImage({
  file,
  category,
  userId,
  publicationId,
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

  // 2. Conditional client-side pre-resize (only when > ~3.5 MB or exceeding max pixel bounds)
  const payloadFile = await prepareImageForUpload(file, category);

  // 3. POST multipart form data to the hybrid WebP upload endpoint
  const filename = originalFilename || (file instanceof File ? file.name : 'upload');
  const formData = new FormData();
  formData.append('file', payloadFile, filename);
  formData.append('category', category);
  if (userId) {
    formData.append('userId', userId);
  }
  if (publicationId) {
    formData.append('publicationId', publicationId);
  }
  if (originalFilename) {
    formData.append('originalFilename', originalFilename);
  }

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json().catch(() => null)) as
    | (UploadStorageImageResult & { error?: string })
    | null;

  if (!response.ok || !data?.publicUrl) {
    throw new Error(data?.error || 'UPLOAD_FAILED');
  }

  return {
    publicUrl: data.publicUrl,
    path: data.path,
    width: data.width,
    height: data.height,
  };
}

const STORAGE_LIST_PAGE_SIZE = 1000;
const STORAGE_REMOVE_BATCH_SIZE = 1000;

async function removeStoragePathsInBatches(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[],
  errorContext: string
): Promise<void> {
  for (let i = 0; i < paths.length; i += STORAGE_REMOVE_BATCH_SIZE) {
    const chunk = paths.slice(i, i + STORAGE_REMOVE_BATCH_SIZE);
    const { error } = await supabase.storage.from(bucket).remove(chunk);
    if (error) {
      console.error(`${errorContext}:`, error.message);
    }
  }
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
      await removeStoragePathsInBatches(
        supabase,
        bucket,
        paths,
        `Failed to remove storage images from '${bucket}'`
      );
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

/**
 * Lists and removes all objects under `publications/{publicationId}/` in the primary
 * `media` bucket, including top-level cover files and nested `inline/` files.
 * Returned storage errors are logged and ignored so post-deletion cleanup never masks
 * a completed database deletion.
 */
export async function sweepPublicationStorageFolder(
  supabase: SupabaseClient,
  publicationId: string
): Promise<void> {
  const safeId = publicationId.trim();
  if (!safeId) return;

  const rootPrefix = `publications/${safeId}`;
  const prefixesToScan = [rootPrefix, `${rootPrefix}/inline`];
  const pathsToRemove = new Set<string>();

  for (const prefix of prefixesToScan) {
    let offset = 0;

    while (true) {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(prefix, { limit: STORAGE_LIST_PAGE_SIZE, offset });

      if (error) {
        console.error(`Failed to list storage folder '${prefix}':`, error.message);
        break;
      }

      const items = data ?? [];
      for (const item of items) {
        // Subfolder placeholders returned by Supabase Storage have id === null
        if (!item.name || item.id === null) continue;
        pathsToRemove.add(`${prefix}/${item.name}`);
      }

      if (items.length < STORAGE_LIST_PAGE_SIZE) {
        break;
      }

      offset += items.length;
    }
  }

  const paths = Array.from(pathsToRemove);
  if (paths.length > 0) {
    await removeStoragePathsInBatches(
      supabase,
      STORAGE_BUCKET,
      paths,
      `Failed to sweep storage folder '${rootPrefix}'`
    );
  }
}
