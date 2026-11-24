import { NextResponse } from 'next/server';
import sharp, { type Metadata } from 'sharp';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  DB_TABLES,
  PUBLICATION_COLS,
  PUBLICATION_STATUSES,
  canAccessWriterDesk,
  canPublishDirectly,
} from '@/lib/db/schema';
import {
  STORAGE_BUCKET,
  STORAGE_CACHE_CONTROL,
  STORAGE_CATEGORIES,
  STORAGE_PRESETS,
  type StorageCategory,
} from '@/lib/storage/constants';
import { buildStoragePath } from '@/lib/storage/paths';

const VALID_CATEGORIES = new Set<string>(Object.values(STORAGE_CATEGORIES));
const SUPPORTED_SHARP_FORMATS = new Set<string>(['jpeg', 'png', 'webp']);
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024; // 5 MB bucket ceiling

function isStorageCategory(value: unknown): value is StorageCategory {
  return typeof value === 'string' && VALID_CATEGORIES.has(value);
}

export async function POST(req: Request) {
  try {
    const { user, role } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const formData = await req.formData();
    const rawFile = formData.get('file');
    const rawCategory = formData.get('category');
    const rawUserId = formData.get('userId');
    const rawPublicationId = formData.get('publicationId');
    const rawOriginalFilename = formData.get('originalFilename');

    if (!isStorageCategory(rawCategory)) {
      return NextResponse.json({ error: 'INVALID_CATEGORY' }, { status: 400 });
    }

    if (!(rawFile instanceof Blob) || rawFile.size === 0) {
      return NextResponse.json({ error: 'MISSING_FILE' }, { status: 400 });
    }

    const category = rawCategory;
    const preset = STORAGE_PRESETS[category];

    if (rawFile.size > preset.maxInputBytes) {
      const maxMb = Math.round(preset.maxInputBytes / (1024 * 1024));
      return NextResponse.json({ error: `FILE_TOO_LARGE:${maxMb}` }, { status: 413 });
    }

    const supabase = await createClient();
    const isOperator = canPublishDirectly(role);
    let entityId: string;

    if (category === STORAGE_CATEGORIES.PROFILE_AVATAR) {
      const requestedUserId = typeof rawUserId === 'string' && rawUserId.trim()
        ? rawUserId.trim()
        : user.id;

      if (requestedUserId !== user.id && !isOperator) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
      entityId = requestedUserId;
    } else {
      if (!canAccessWriterDesk(role)) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }

      const publicationId = typeof rawPublicationId === 'string' ? rawPublicationId.trim() : '';
      if (!publicationId) {
        return NextResponse.json({ error: 'MISSING_PUBLICATION_ID' }, { status: 400 });
      }

      const { data: pub, error: pubError } = await supabase
        .from(DB_TABLES.PUBLICATIONS)
        .select(`${PUBLICATION_COLS.ID}, ${PUBLICATION_COLS.AUTHOR_ID}, ${PUBLICATION_COLS.STATUS}`)
        .eq(PUBLICATION_COLS.ID, publicationId)
        .single();

      if (pubError || !pub) {
        return NextResponse.json({ error: 'PUBLICATION_NOT_FOUND' }, { status: 404 });
      }

      if (!isOperator) {
        if (pub[PUBLICATION_COLS.AUTHOR_ID] !== user.id) {
          return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
        }
        if (pub[PUBLICATION_COLS.STATUS] === PUBLICATION_STATUSES.PUBLISHED) {
          return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
        }
      }

      entityId = publicationId;
    }

    const inputBuffer = Buffer.from(await rawFile.arrayBuffer());
    let metadata: Metadata;
    try {
      metadata = await sharp(inputBuffer).metadata();
    } catch {
      return NextResponse.json({ error: 'INVALID_FORMAT' }, { status: 400 });
    }

    if (
      !metadata.format ||
      !SUPPORTED_SHARP_FORMATS.has(metadata.format) ||
      !metadata.width ||
      !metadata.height
    ) {
      return NextResponse.json({ error: 'INVALID_FORMAT' }, { status: 400 });
    }

    let outputBuffer: Buffer;
    let width: number;
    let height: number;

    const satisfiesFit = preset.fit !== 'cover' || metadata.width === metadata.height;

    const isAlreadyValidInBoundsWebp =
      metadata.format === 'webp' &&
      metadata.width <= preset.maxWidth &&
      metadata.height <= preset.maxHeight &&
      satisfiesFit &&
      inputBuffer.byteLength <= MAX_OUTPUT_BYTES;

    if (isAlreadyValidInBoundsWebp) {
      outputBuffer = inputBuffer;
      width = metadata.width;
      height = metadata.height;
    } else {
      const processed = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: preset.maxWidth,
          height: preset.maxHeight,
          fit: preset.fit,
          withoutEnlargement: true,
        })
        .webp({ quality: Math.round(preset.quality * 100) })
        .toBuffer({ resolveWithObject: true });

      outputBuffer = processed.data;
      width = processed.info.width;
      height = processed.info.height;
    }

    if (outputBuffer.byteLength > MAX_OUTPUT_BYTES) {
      const maxOutputMb = Math.round(MAX_OUTPUT_BYTES / (1024 * 1024));
      return NextResponse.json({ error: `FILE_TOO_LARGE:${maxOutputMb}` }, { status: 413 });
    }

    const filenameFromBlob = rawFile instanceof File ? rawFile.name : undefined;
    const originalFilename =
      typeof rawOriginalFilename === 'string' && rawOriginalFilename.trim()
        ? rawOriginalFilename.trim()
        : filenameFromBlob;

    const path = buildStoragePath(category, entityId, 'webp', originalFilename);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, outputBuffer, {
        contentType: 'image/webp',
        cacheControl: STORAGE_CACHE_CONTROL,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Storage Upload API] Supabase upload error:', uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      publicUrl: urlData.publicUrl,
      path,
      width,
      height,
    });
  } catch (error: unknown) {
    console.error('[Storage Upload API] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'UPLOAD_FAILED' },
      { status: 500 }
    );
  }
}
