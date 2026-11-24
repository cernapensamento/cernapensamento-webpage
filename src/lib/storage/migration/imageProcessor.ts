import sharp from 'sharp';
import { STORAGE_PRESETS, type StorageCategory } from '../constants';

export interface ProcessedMigrationImage {
  buffer: Buffer;
  converted: boolean;
  width: number;
  height: number;
}

const ORPHAN_PRESET = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  fit: 'inside' as const,
};

/**
 * Processes an image buffer for storage migration:
 * - Already-WebP buffers are returned byte-for-byte without re-encoding.
 * - Non-WebP buffers (JPEG, PNG, etc.) are converted to WebP via `sharp`
 *   using category presets without upscaling (`withoutEnlargement: true`).
 */
export async function processImageForMigration(
  input: Buffer,
  category: StorageCategory | 'orphan'
): Promise<ProcessedMigrationImage> {
  const image = sharp(input, { failOn: 'error' });
  const metadata = await image.metadata();

  if (metadata.format === 'webp') {
    return {
      buffer: input,
      converted: false,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    };
  }

  const preset = category === 'orphan' ? ORPHAN_PRESET : STORAGE_PRESETS[category];
  const quality = Math.round(preset.quality * 100);

  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: preset.maxWidth,
      height: preset.maxHeight,
      fit: preset.fit,
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    converted: true,
    width: info.width,
    height: info.height,
  };
}
