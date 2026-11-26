import { createHash } from 'node:crypto';
import { Parser } from 'htmlparser2';
import {
  LEGACY_STORAGE_BUCKETS,
  STORAGE_BUCKET,
  STORAGE_CACHE_CONTROL,
  STORAGE_CATEGORIES,
  type StorageCategory,
} from '../constants';
import {
  CURRENT_STORAGE_HOST,
  LEGACY_STORAGE_HOST,
  extractBucketAndPathFromUrl,
} from '../paths';
import { processImageForMigration } from './imageProcessor';
import {
  CleanupGuardrailError,
  MissingStorageObjectsError,
  type CleanupOptions,
  type CleanupResult,
  type MigrateOptions,
  type MigrationAction,
  type MigrationDbUpdates,
  type MigrationManifest,
  type MigrationMappingEntry,
  type MigrationOrphanEntry,
  type MigrationPublicationRow,
  type MigrationUserRow,
} from './types';

function shortHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 10);
}

function sanitizeInlineBase(sourcePath: string): string {
  const filename = sourcePath.split('/').pop() ?? 'figure';
  const rawName = filename.split('.')[0] || '';
  const clean = rawName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return clean || 'figure';
}

function isInternalStorageUrl(
  url: string,
  currentHost: string,
  legacyHost: string
): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isKnownHost =
      host === currentHost.toLowerCase() ||
      host === legacyHost.toLowerCase() ||
      host === '127.0.0.1' ||
      host === 'localhost';
    if (!isKnownHost) return false;
    return extractBucketAndPathFromUrl(url) !== null;
  } catch {
    // Relative storage path
    return extractBucketAndPathFromUrl(url) !== null;
  }
}

function isCanonicalTargetPath(
  bucket: string,
  path: string,
  category: StorageCategory,
  entityId: string
): boolean {
  if (bucket !== STORAGE_BUCKET || !path.toLowerCase().endsWith('.webp')) {
    return false;
  }

  if (category === STORAGE_CATEGORIES.PROFILE_AVATAR) {
    return path.startsWith(`users/${entityId}/`);
  }

  if (category === STORAGE_CATEGORIES.PUBLICATION_COVER) {
    return (
      path.startsWith(`publications/${entityId}/`) &&
      !path.startsWith(`publications/${entityId}/inline/`)
    );
  }

  return path.startsWith(`publications/${entityId}/inline/`);
}

function buildDeterministicTargetPath(
  category: StorageCategory,
  entityId: string,
  sourceBucket: string,
  sourcePath: string
): string {
  const hash = shortHash(`${sourceBucket}/${sourcePath}`);
  if (category === STORAGE_CATEGORIES.PROFILE_AVATAR) {
    return `users/${entityId}/avatar-migrated-${hash}.webp`;
  }
  if (category === STORAGE_CATEGORIES.PUBLICATION_COVER) {
    return `publications/${entityId}/cover-migrated-${hash}.webp`;
  }
  const base = sanitizeInlineBase(sourcePath);
  return `publications/${entityId}/inline/${base}-migrated-${hash}.webp`;
}

function buildOrphanTargetPath(sourceBucket: string, sourcePath: string): string {
  const hash = shortHash(`${sourceBucket}/${sourcePath}`);
  if (sourcePath.toLowerCase().endsWith('.webp')) {
    const stem = sourcePath.slice(0, -5);
    return `_orphans/${sourceBucket}/${stem}-${hash}.webp`;
  }
  return `_orphans/${sourceBucket}/${sourcePath}-${hash}.webp`;
}

interface ImgSrcSpan {
  start: number;
  end: number;
  value: string;
  quote: string | null | undefined;
}

function findImgSrcSpans(html: string): ImgSrcSpan[] {
  const spans: ImgSrcSpan[] = [];
  let currentTag = '';
  let seenSrcOnCurrentImg = false;

  const parser = new Parser({
    onopentagname(name) {
      currentTag = name.toLowerCase();
      seenSrcOnCurrentImg = false;
    },
    onattribute(name, value, quote) {
      if (currentTag === 'img' && name.toLowerCase() === 'src' && !seenSrcOnCurrentImg) {
        seenSrcOnCurrentImg = true;
        if (value) {
          spans.push({
            start: parser.startIndex,
            end: parser.endIndex,
            value,
            quote,
          });
        }
      }
    },
    onopentag() {
      currentTag = '';
      seenSrcOnCurrentImg = false;
    },
  });

  parser.write(html);
  parser.end();
  return spans;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractInlineImageUrls(html: string | null | undefined): string[] {
  if (!html || typeof html !== 'string') return [];
  return findImgSrcSpans(html).map((span) => span.value);
}

function replaceInlineImageUrls(
  html: string,
  replacements: Map<string, string>
): string {
  const spans = findImgSrcSpans(html);
  if (spans.length === 0) return html;

  let out = '';
  let cursor = 0;
  let changed = false;

  for (const span of spans) {
    const nextUrl = replacements.get(span.value);
    if (!nextUrl || nextUrl === span.value) continue;
    const escaped = escapeHtmlAttribute(nextUrl);
    const formatted = span.quote === "'" ? `src='${escaped}'` : `src="${escaped}"`;
    out += html.slice(cursor, span.start) + formatted;
    cursor = span.end;
    changed = true;
  }

  if (!changed) return html;
  out += html.slice(cursor);
  return out;
}

function collectLegacyRefsFromDb(
  users: MigrationUserRow[],
  publications: MigrationPublicationRow[],
  legacyHost: string
): string[] {
  const legacyRefs: string[] = [];
  const checkUrl = (url: string | null | undefined) => {
    if (!url) return;
    if (
      url.includes(legacyHost) ||
      LEGACY_STORAGE_BUCKETS.some((b) => url.includes(`/${b}/`) || url.startsWith(`${b}/`))
    ) {
      legacyRefs.push(url);
    }
  };

  for (const user of users) {
    checkUrl(user.avatar_url);
  }
  for (const pub of publications) {
    checkUrl(pub.cover_image_url);
    if (pub.content && typeof pub.content === 'object') {
      for (const html of Object.values(pub.content)) {
        for (const src of extractInlineImageUrls(html)) {
          checkUrl(src);
        }
      }
    }
  }
  return legacyRefs;
}

interface ScannedReference {
  entityType: 'user' | 'publication';
  entityId: string;
  field: string;
  category: StorageCategory;
  rawUrl: string;
}

export async function runMigrate(options: MigrateOptions): Promise<MigrationManifest> {
  const {
    storage,
    db,
    httpVerifier,
    currentHost = CURRENT_STORAGE_HOST,
    legacyHost = LEGACY_STORAGE_HOST,
    dryRun = false,
    now = new Date(),
  } = options;

  const sourceBuckets = [STORAGE_BUCKET, ...LEGACY_STORAGE_BUCKETS];

  // 1. Inventory all objects in media and legacy buckets
  const inventory = new Map<string, Set<string>>();
  for (const bucket of sourceBuckets) {
    const objects = await storage.listObjects(bucket);
    inventory.set(bucket, new Set(objects));
  }

  // 2. Fetch all users and publications from DB
  const [users, publications] = await Promise.all([
    db.fetchUsers(),
    db.fetchPublications(),
  ]);

  // 3. Scan all references
  const references: ScannedReference[] = [];
  for (const user of users) {
    if (user.avatar_url) {
      references.push({
        entityType: 'user',
        entityId: user.id,
        field: 'avatar_url',
        category: STORAGE_CATEGORIES.PROFILE_AVATAR,
        rawUrl: user.avatar_url,
      });
    }
  }

  for (const pub of publications) {
    if (pub.cover_image_url) {
      references.push({
        entityType: 'publication',
        entityId: pub.id,
        field: 'cover_image_url',
        category: STORAGE_CATEGORIES.PUBLICATION_COVER,
        rawUrl: pub.cover_image_url,
      });
    }
    if (pub.content && typeof pub.content === 'object') {
      for (const [locale, html] of Object.entries(pub.content)) {
        if (!html) continue;
        for (const src of extractInlineImageUrls(html)) {
          references.push({
            entityType: 'publication',
            entityId: pub.id,
            field: `content.${locale}`,
            category: STORAGE_CATEGORIES.PUBLICATION_INLINE,
            rawUrl: src,
          });
        }
      }
    }
  }

  // 4. Classify URLs & Fail-Fast on missing objects
  const externalUrlsSet = new Set<string>();
  const missingObjects: MissingStorageObjectsError['missing'] = [];
  const referencedSourceKeys = new Set<string>();

  // Deduplicate mappings by (entityId, category, oldUrl) so same-publication gl/es share one entry
  const mappingByKey = new Map<string, MigrationMappingEntry>();
  const urlReplacementByEntity = new Map<string, Map<string, string>>();

  for (const ref of references) {
    if (!isInternalStorageUrl(ref.rawUrl, currentHost, legacyHost)) {
      externalUrlsSet.add(ref.rawUrl);
      continue;
    }

    const extracted = extractBucketAndPathFromUrl(ref.rawUrl);
    if (!extracted) {
      externalUrlsSet.add(ref.rawUrl);
      continue;
    }

    // Resolve actual bucket where object exists
    let resolvedBucket: string | null = null;
    if (inventory.get(extracted.bucket)?.has(extracted.path)) {
      resolvedBucket = extracted.bucket;
    } else {
      for (const candidateBucket of sourceBuckets) {
        if (inventory.get(candidateBucket)?.has(extracted.path)) {
          resolvedBucket = candidateBucket;
          break;
        }
      }
    }

    if (!resolvedBucket) {
      missingObjects.push({
        entityType: ref.entityType,
        entityId: ref.entityId,
        field: ref.field,
        url: ref.rawUrl,
        bucket: extracted.bucket,
        path: extracted.path,
      });
      continue;
    }

    referencedSourceKeys.add(`${resolvedBucket}/${extracted.path}`);

    const alreadyCanonical = isCanonicalTargetPath(
      resolvedBucket,
      extracted.path,
      ref.category,
      ref.entityId
    );

    const targetPath = alreadyCanonical
      ? extracted.path
      : buildDeterministicTargetPath(
          ref.category,
          ref.entityId,
          resolvedBucket,
          extracted.path
        );

    const newUrl = storage.getPublicUrl(STORAGE_BUCKET, targetPath);

    let entityMap = urlReplacementByEntity.get(`${ref.entityType}:${ref.entityId}`);
    if (!entityMap) {
      entityMap = new Map();
      urlReplacementByEntity.set(`${ref.entityType}:${ref.entityId}`, entityMap);
    }
    entityMap.set(`${ref.category}:${ref.rawUrl}`, newUrl);

    const dedupeKey = `${ref.entityId}|${ref.category}|${targetPath}|${ref.rawUrl}`;
    if (!mappingByKey.has(dedupeKey)) {
      const action: MigrationAction = alreadyCanonical
        ? 'already_canonical'
        : extracted.path.toLowerCase().endsWith('.webp')
          ? 'copy_webp'
          : 'convert_webp';

      mappingByKey.set(dedupeKey, {
        oldUrl: ref.rawUrl,
        newUrl,
        sourceBucket: resolvedBucket,
        sourcePath: extracted.path,
        targetPath,
        category: ref.category,
        entityId: ref.entityId,
        action,
      });
    }
  }

  // Fail fast BEFORE writing any storage object or DB row
  if (missingObjects.length > 0) {
    throw new MissingStorageObjectsError(missingObjects);
  }

  const mappings = Array.from(mappingByKey.values());

  // 5. Classify unreferenced objects as orphans
  const orphans: MigrationOrphanEntry[] = [];
  const orphanTargetPaths = new Set<string>();
  for (const bucket of sourceBuckets) {
    const objects = inventory.get(bucket) ?? new Set<string>();
    for (const objectPath of objects) {
      if (bucket === STORAGE_BUCKET && objectPath.startsWith('_orphans/')) {
        continue;
      }
      const key = `${bucket}/${objectPath}`;
      if (!referencedSourceKeys.has(key)) {
        const targetPath = buildOrphanTargetPath(bucket, objectPath);
        if (orphanTargetPaths.has(targetPath)) {
          throw new Error(`Orphan target path collision detected: ${targetPath}`);
        }
        orphanTargetPaths.add(targetPath);
        orphans.push({
          sourceBucket: bucket,
          sourcePath: objectPath,
          targetPath,
          action: objectPath.toLowerCase().endsWith('.webp') ? 'copy_webp' : 'convert_webp',
        });
      }
    }
  }

  // Compute DB updates (only rows whose URLs actually change)
  const dbUpdates: MigrationDbUpdates = { users: [], publications: [] };

  for (const user of users) {
    if (!user.avatar_url) continue;
    const replacements = urlReplacementByEntity.get(`user:${user.id}`);
    const nextUrl = replacements?.get(
      `${STORAGE_CATEGORIES.PROFILE_AVATAR}:${user.avatar_url}`
    );
    if (nextUrl && nextUrl !== user.avatar_url) {
      dbUpdates.users.push({ id: user.id, avatar_url: nextUrl });
    }
  }

  for (const pub of publications) {
    const replacements = urlReplacementByEntity.get(`publication:${pub.id}`);
    if (!replacements || replacements.size === 0) continue;

    let changed = false;
    const pubUpdate: MigrationDbUpdates['publications'][number] = {
      id: pub.id,
      originalCoverImageUrl: pub.cover_image_url ?? null,
      originalContent: pub.content ? { ...pub.content } : null,
    };

    if (pub.cover_image_url) {
      const nextCover = replacements.get(
        `${STORAGE_CATEGORIES.PUBLICATION_COVER}:${pub.cover_image_url}`
      );
      if (nextCover && nextCover !== pub.cover_image_url) {
        pubUpdate.cover_image_url = nextCover;
        changed = true;
      }
    }

    if (pub.content && typeof pub.content === 'object') {
      const inlineReplacements = new Map<string, string>();
      const inlinePrefix = `${STORAGE_CATEGORIES.PUBLICATION_INLINE}:`;
      for (const [key, value] of replacements.entries()) {
        if (key.startsWith(inlinePrefix)) {
          inlineReplacements.set(key.slice(inlinePrefix.length), value);
        }
      }

      if (inlineReplacements.size > 0) {
        let contentChanged = false;
        const nextContent: Record<string, string | null | undefined> = { ...pub.content };
        for (const [locale, html] of Object.entries(pub.content)) {
          if (!html) continue;
          const rewritten = replaceInlineImageUrls(html, inlineReplacements);
          if (rewritten !== html) {
            nextContent[locale] = rewritten;
            contentChanged = true;
          }
        }
        if (contentChanged) {
          pubUpdate.content = nextContent;
          changed = true;
        }
      }
    }

    if (changed) {
      dbUpdates.publications.push(pubUpdate);
    }
  }

  const manifest: MigrationManifest = {
    version: 1,
    generatedAt: now.toISOString(),
    dryRun,
    sourceBuckets,
    targetBucket: STORAGE_BUCKET,
    currentHost,
    legacyHost,
    mappings,
    orphans,
    externalUrls: Array.from(externalUrlsSet).sort(),
    dbUpdates: {
      userCount: dbUpdates.users.length,
      publicationCount: dbUpdates.publications.length,
    },
  };

  if (dryRun) {
    return manifest;
  }

  // 6. Execute storage writes idempotently
  const mediaInventory = inventory.get(STORAGE_BUCKET) ?? new Set<string>();
  const uploadedTargets = new Set<string>();

  for (const mapping of mappings) {
    if (mapping.action === 'already_canonical') {
      mapping.skipped = true;
      continue;
    }

    if (mediaInventory.has(mapping.targetPath) || uploadedTargets.has(mapping.targetPath)) {
      mapping.skipped = true;
      continue;
    }

    const rawBuffer = await storage.downloadObject(mapping.sourceBucket, mapping.sourcePath);
    const processed = await processImageForMigration(rawBuffer, mapping.category);
    mapping.action = processed.converted ? 'convert_webp' : 'copy_webp';

    await storage.uploadObject(STORAGE_BUCKET, mapping.targetPath, processed.buffer, {
      contentType: 'image/webp',
      cacheControl: STORAGE_CACHE_CONTROL,
    });

    uploadedTargets.add(mapping.targetPath);
    mediaInventory.add(mapping.targetPath);
  }

  for (const orphan of orphans) {
    if (mediaInventory.has(orphan.targetPath) || uploadedTargets.has(orphan.targetPath)) {
      orphan.skipped = true;
      continue;
    }

    const rawBuffer = await storage.downloadObject(orphan.sourceBucket, orphan.sourcePath);
    const processed = await processImageForMigration(rawBuffer, 'orphan');
    orphan.action = processed.converted ? 'convert_webp' : 'copy_webp';

    await storage.uploadObject(STORAGE_BUCKET, orphan.targetPath, processed.buffer, {
      contentType: 'image/webp',
      cacheControl: STORAGE_CACHE_CONTROL,
    });

    uploadedTargets.add(orphan.targetPath);
    mediaInventory.add(orphan.targetPath);
  }

  // 7. Apply DB updates in a single transaction
  if (dbUpdates.users.length > 0 || dbUpdates.publications.length > 0) {
    await db.applyUpdatesInTransaction(dbUpdates);
  }

  // 8. Verification pass
  const [postUsers, postPublications] = await Promise.all([
    db.fetchUsers(),
    db.fetchPublications(),
  ]);

  const remainingLegacyRefs = collectLegacyRefsFromDb(postUsers, postPublications, legacyHost);

  const uniqueNewUrls = Array.from(new Set(mappings.map((m) => m.newUrl)));
  const failedUrls: Array<{
    url: string;
    status: number;
    contentType: string | null;
    error?: string;
  }> = [];

  for (const url of uniqueNewUrls) {
    try {
      const res = await httpVerifier(url);
      const isWebp = res.contentType?.toLowerCase().includes('image/webp') ?? false;
      if (res.status !== 200 || !isWebp) {
        failedUrls.push({
          url,
          status: res.status,
          contentType: res.contentType,
          error: res.error,
        });
      }
    } catch (err) {
      failedUrls.push({
        url,
        status: 0,
        contentType: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  manifest.verification = {
    passed: remainingLegacyRefs.length === 0 && failedUrls.length === 0,
    verifiedAt: new Date().toISOString(),
    checkedUrls: uniqueNewUrls.length,
    failedUrls,
    remainingLegacyRefs,
  };

  return manifest;
}

export async function runCleanup(options: CleanupOptions): Promise<CleanupResult> {
  const { manifest, storage, db } = options;

  // Guardrail 1: Manifest must be a real (non-dry-run) run that passed verification
  if (manifest.dryRun) {
    throw new CleanupGuardrailError(
      'Refusing to run cleanup: manifest was generated with --dry-run.'
    );
  }

  if (!manifest.verification?.passed) {
    throw new CleanupGuardrailError(
      'Refusing to run cleanup: manifest did not pass verification.'
    );
  }

  // Guardrail 2: Verify zero old paths or legacy host/bucket URLs remain referenced in PostgreSQL
  const [users, publications] = await Promise.all([
    db.fetchUsers(),
    db.fetchPublications(),
  ]);

  const remainingLegacyRefs = collectLegacyRefsFromDb(
    users,
    publications,
    manifest.legacyHost
  );
  if (remainingLegacyRefs.length > 0) {
    throw new CleanupGuardrailError(
      `Refusing to run cleanup: ${remainingLegacyRefs.length} legacy URL(s) still referenced in PostgreSQL.`
    );
  }

  const slatedDeletionKeys = new Set<string>();
  for (const mapping of manifest.mappings) {
    if (
      mapping.sourceBucket !== manifest.targetBucket ||
      mapping.sourcePath !== mapping.targetPath
    ) {
      slatedDeletionKeys.add(`${mapping.sourceBucket}/${mapping.sourcePath}`);
    }
    if (isInternalStorageUrl(mapping.oldUrl, manifest.currentHost, manifest.legacyHost)) {
      const oldExtracted = extractBucketAndPathFromUrl(mapping.oldUrl);
      if (
        oldExtracted &&
        (oldExtracted.bucket !== manifest.targetBucket ||
          oldExtracted.path !== mapping.targetPath)
      ) {
        slatedDeletionKeys.add(`${oldExtracted.bucket}/${oldExtracted.path}`);
      }
    }
  }
  for (const orphan of manifest.orphans) {
    if (
      orphan.sourceBucket !== manifest.targetBucket ||
      orphan.sourcePath !== orphan.targetPath
    ) {
      slatedDeletionKeys.add(`${orphan.sourceBucket}/${orphan.sourcePath}`);
    }
  }

  const stillReferencedKeys: string[] = [];
  const checkLiveUrl = (url: string | null | undefined) => {
    if (!url) return;
    if (!isInternalStorageUrl(url, manifest.currentHost, manifest.legacyHost)) return;
    const extracted = extractBucketAndPathFromUrl(url);
    if (!extracted) return;
    const normalizedKey = `${extracted.bucket}/${extracted.path}`;
    if (slatedDeletionKeys.has(normalizedKey)) {
      stillReferencedKeys.push(normalizedKey);
    }
  };

  for (const user of users) {
    checkLiveUrl(user.avatar_url);
  }
  for (const pub of publications) {
    checkLiveUrl(pub.cover_image_url);
    if (pub.content && typeof pub.content === 'object') {
      for (const html of Object.values(pub.content)) {
        for (const src of extractInlineImageUrls(html)) {
          checkLiveUrl(src);
        }
      }
    }
  }

  if (stillReferencedKeys.length > 0) {
    throw new CleanupGuardrailError(
      `Refusing to run cleanup: ${stillReferencedKeys.length} slated deletion key(s) still referenced in PostgreSQL.`
    );
  }

  // Remove superseded legacy paths from `media`
  const mediaPathsToRemove = new Set<string>();
  for (const mapping of manifest.mappings) {
    if (
      mapping.sourceBucket === STORAGE_BUCKET &&
      mapping.sourcePath !== mapping.targetPath
    ) {
      mediaPathsToRemove.add(mapping.sourcePath);
    }
  }
  for (const orphan of manifest.orphans) {
    if (
      orphan.sourceBucket === STORAGE_BUCKET &&
      orphan.sourcePath !== orphan.targetPath
    ) {
      mediaPathsToRemove.add(orphan.sourcePath);
    }
  }

  const removedMediaPaths = Array.from(mediaPathsToRemove).sort();
  if (removedMediaPaths.length > 0) {
    await storage.removeObjects(STORAGE_BUCKET, removedMediaPaths);
  }

  // Empty and delete legacy buckets (e.g. `imagenes-articulos`)
  const removedLegacyBucketPaths: string[] = [];
  const deletedLegacyBuckets: string[] = [];

  for (const legacyBucket of LEGACY_STORAGE_BUCKETS) {
    const exists = await storage.bucketExists(legacyBucket);
    if (!exists) continue;

    const objects = await storage.listObjects(legacyBucket);
    if (objects.length > 0) {
      await storage.removeObjects(legacyBucket, objects);
      removedLegacyBucketPaths.push(...objects.map((p) => `${legacyBucket}/${p}`));
    }

    await storage.deleteBucket(legacyBucket);
    deletedLegacyBuckets.push(legacyBucket);
  }

  return {
    removedMediaPaths,
    removedLegacyBucketPaths,
    deletedLegacyBuckets,
  };
}
