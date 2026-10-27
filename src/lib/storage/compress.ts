import {
  type StorageCategory,
  STORAGE_PRESETS,
} from './constants';

export interface CompressedImageResult {
  blob: Blob;
  format: 'webp' | 'jpeg';
  width: number;
  height: number;
  extension: 'webp' | 'jpeg';
}

/**
 * Calculates resized dimensions while respecting aspect ratio and preset bounds.
 */
function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = origWidth;
  let height = origHeight;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
}

/**
 * Resizes an image within the category's pixel bounds without enlarging it and
 * encodes WebP, falling back to JPEG when WebP output is unavailable.
 * Requires browser image, object URL, and canvas APIs. Returns the encoded blob,
 * format/extension, and output dimensions in pixels. Rejects failed image loads,
 * unavailable canvas contexts, and empty encoding results; caught browser API
 * errors propagate as promise rejections.
 */
export async function compressImageClient(
  file: File | Blob,
  category: StorageCategory
): Promise<CompressedImageResult> {
  const preset = STORAGE_PRESETS[category];

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          preset.maxWidth,
          preset.maxHeight
        );

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Unable to create canvas 2d context for image compression');
        }

        // Enable high-quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Attempt WebP first; check if browser actually produces image/webp
        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.type === 'image/webp') {
              resolve({
                blob: webpBlob,
                format: 'webp',
                width: targetWidth,
                height: targetHeight,
                extension: 'webp',
              });
              return;
            }

            // Fallback to JPEG if WebP is unsupported
            canvas.toBlob(
              (jpegBlob) => {
                if (!jpegBlob) {
                  reject(new Error('Canvas image compression failed'));
                  return;
                }
                resolve({
                  blob: jpegBlob,
                  format: 'jpeg',
                  width: targetWidth,
                  height: targetHeight,
                  extension: 'jpeg',
                });
              },
              'image/jpeg',
              preset.quality
            );
          },
          'image/webp',
          preset.quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}
