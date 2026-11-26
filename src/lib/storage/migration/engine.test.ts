import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { runMigrate, runCleanup } from './engine';
import { processImageForMigration } from './imageProcessor';
import {
  CleanupGuardrailError,
  MissingStorageObjectsError,
  type MigrationDbAdapter,
  type MigrationPublicationRow,
  type MigrationStorageAdapter,
  type MigrationUserRow,
} from './types';

async function createTestImage(
  format: 'jpeg' | 'png' | 'webp',
  width: number,
  height: number
): Promise<Buffer> {
  const img = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 80, b: 40 },
    },
  });

  if (format === 'jpeg') return img.jpeg({ quality: 90 }).toBuffer();
  if (format === 'png') return img.png().toBuffer();
  return img.webp({ quality: 82 }).toBuffer();
}

function createInMemoryAdapters(initial: {
  buckets: Record<string, Record<string, Buffer>>;
  users: MigrationUserRow[];
  publications: MigrationPublicationRow[];
  host?: string;
}) {
  const host = initial.host ?? 'srbrnpbtfmilohkicpbb.supabase.co';
  const buckets = new Map<string, Map<string, { body: Buffer; contentType: string }>>();

  for (const [bucketName, files] of Object.entries(initial.buckets)) {
    const fileMap = new Map<string, { body: Buffer; contentType: string }>();
    for (const [filePath, body] of Object.entries(files)) {
      const contentType = filePath.endsWith('.webp')
        ? 'image/webp'
        : filePath.endsWith('.png')
          ? 'image/png'
          : 'image/jpeg';
      fileMap.set(filePath, { body, contentType });
    }
    buckets.set(bucketName, fileMap);
  }

  const users: MigrationUserRow[] = structuredClone(initial.users);
  const publications: MigrationPublicationRow[] = structuredClone(initial.publications);
  let transactionCount = 0;
  let uploadCount = 0;

  const storage: MigrationStorageAdapter = {
    async bucketExists(bucket) {
      return buckets.has(bucket);
    },
    async listObjects(bucket) {
      const map = buckets.get(bucket);
      if (!map) return [];
      return Array.from(map.keys()).sort();
    },
    async downloadObject(bucket, path) {
      const entry = buckets.get(bucket)?.get(path);
      if (!entry) throw new Error(`Object not found: ${bucket}/${path}`);
      return entry.body;
    },
    async uploadObject(bucket, path, body, options) {
      uploadCount += 1;
      let map = buckets.get(bucket);
      if (!map) {
        map = new Map();
        buckets.set(bucket, map);
      }
      map.set(path, { body, contentType: options.contentType });
    },
    async removeObjects(bucket, paths) {
      const map = buckets.get(bucket);
      if (!map) return;
      for (const p of paths) {
        map.delete(p);
      }
    },
    async deleteBucket(bucket) {
      buckets.delete(bucket);
    },
    getPublicUrl(bucket, path) {
      return `https://${host}/storage/v1/object/public/${bucket}/${path}`;
    },
  };

  const db: MigrationDbAdapter = {
    async fetchUsers() {
      return structuredClone(users);
    },
    async fetchPublications() {
      return structuredClone(publications);
    },
    async applyUpdatesInTransaction(updates) {
      transactionCount += 1;
      for (const u of updates.users) {
        const target = users.find((row) => row.id === u.id);
        if (target) target.avatar_url = u.avatar_url;
      }
      for (const p of updates.publications) {
        const target = publications.find((row) => row.id === p.id);
        if (!target) {
          throw new Error(`Publication not found: ${p.id}`);
        }
        const coverMatches = (target.cover_image_url ?? null) === p.originalCoverImageUrl;
        const contentMatches =
          JSON.stringify(target.content ?? null) === JSON.stringify(p.originalContent);
        if (!coverMatches || !contentMatches) {
          throw new Error(`Optimistic concurrency conflict for publication ${p.id}`);
        }
        if (p.cover_image_url !== undefined) target.cover_image_url = p.cover_image_url;
        if (p.content !== undefined) target.content = p.content;
      }
    },
  };

  const httpVerifier = async (url: string) => {
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!match) return { status: 404, contentType: null };
    const [, bucket, path] = match;
    const entry = buckets.get(bucket)?.get(path);
    if (!entry) return { status: 404, contentType: null };
    return { status: 200, contentType: entry.contentType };
  };

  return {
    storage,
    db,
    httpVerifier,
    getBuckets: () => buckets,
    getUsers: () => users,
    getPublications: () => publications,
    getTransactionCount: () => transactionCount,
    getUploadCount: () => uploadCount,
  };
}

describe('Storage Migration Engine', () => {
  it('plans dry-run migration without mutating storage or DB, classifying legacy hosts, external URLs, shared inline images, cross-pub duplicates, monolingual pubs, and orphans', async () => {
    const avatarJpeg = await createTestImage('jpeg', 400, 400);
    const coverPng = await createTestImage('png', 800, 600);
    const sharedInlineWebp = await createTestImage('webp', 600, 400);
    const orphanJpeg = await createTestImage('jpeg', 300, 200);

    const env = createInMemoryAdapters({
      buckets: {
        media: {
          'profiles/user-1/avatar.jpg': avatarJpeg,
          'publications/inline/author-1/shared.webp': sharedInlineWebp,
        },
        'imagenes-articulos': {
          'portadas/legacy-cover.png': coverPng,
          'contenido/orphan.jpg': orphanJpeg,
        },
      },
      users: [
        {
          id: 'user-1',
          avatar_url:
            'https://pzupxjsprmuudmvhzpxu.supabase.co/storage/v1/object/public/media/profiles/user-1/avatar.jpg',
        },
        {
          id: 'user-oauth',
          avatar_url: 'https://lh3.googleusercontent.com/a/google-avatar',
        },
      ],
      publications: [
        {
          id: 'pub-bilingual',
          cover_image_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/legacy-cover.png',
          content: {
            gl: '<p>Ola</p><img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/inline/author-1/shared.webp" />',
            es: '<p>Hola</p><img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/inline/author-1/shared.webp" />',
          },
        },
        {
          id: 'pub-monolingual',
          cover_image_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/legacy-cover.png',
          content: {
            gl: '<p>Só galego</p><img src="https://external.example.org/photo.jpg" />',
          },
        },
      ],
    });

    const manifest = await runMigrate({
      storage: env.storage,
      db: env.db,
      httpVerifier: env.httpVerifier,
      dryRun: true,
    });

    expect(manifest.dryRun).toBe(true);
    expect(env.getTransactionCount()).toBe(0);
    expect(env.getUploadCount()).toBe(0);
    expect(manifest.externalUrls).toEqual([
      'https://external.example.org/photo.jpg',
      'https://lh3.googleusercontent.com/a/google-avatar',
    ]);

    const avatarMapping = manifest.mappings.find((m) => m.entityId === 'user-1');
    expect(avatarMapping?.targetPath).toMatch(/^users\/user-1\/avatar-.*\.webp$/);

    const coverMappings = manifest.mappings.filter((m) => m.category === 'publication_cover');
    expect(coverMappings).toHaveLength(2);
    expect(coverMappings[0].targetPath).not.toBe(coverMappings[1].targetPath);

    const inlineMappings = manifest.mappings.filter((m) => m.category === 'publication_inline');
    expect(inlineMappings).toHaveLength(1);
    expect(inlineMappings[0].targetPath).toMatch(/^publications\/pub-bilingual\/inline\/.*\.webp$/);

    expect(manifest.orphans).toHaveLength(1);
    expect(manifest.orphans[0]).toMatchObject({
      sourceBucket: 'imagenes-articulos',
      sourcePath: 'contenido/orphan.jpg',
    });
    expect(manifest.orphans[0].targetPath).toMatch(
      /^_orphans\/imagenes-articulos\/contenido\/orphan\.jpg-[a-f0-9]{10}\.webp$/
    );
  });

  it('fails fast before writing any storage object or DB row when a referenced object is missing from both buckets', async () => {
    const validAvatar = await createTestImage('jpeg', 200, 200);
    const env = createInMemoryAdapters({
      buckets: {
        media: {
          'profiles/user-1/avatar.jpg': validAvatar,
        },
        'imagenes-articulos': {},
      },
      users: [
        {
          id: 'user-1',
          avatar_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/profiles/user-1/avatar.jpg',
        },
      ],
      publications: [
        {
          id: 'pub-broken',
          cover_image_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/does-not-exist.png',
          content: { gl: '<p>Broken</p>' },
        },
      ],
    });

    await expect(
      runMigrate({
        storage: env.storage,
        db: env.db,
        httpVerifier: env.httpVerifier,
      })
    ).rejects.toThrow(MissingStorageObjectsError);

    expect(env.getUploadCount()).toBe(0);
    expect(env.getTransactionCount()).toBe(0);
  });

  it('converts non-WebP images without upscaling, copies already-WebP byte-for-byte, quarantines orphans, updates DB transactionally, and passes verification', async () => {
    const smallAvatarJpeg = await createTestImage('jpeg', 240, 240);
    const largeCoverPng = await createTestImage('png', 2000, 1500);
    const existingInlineWebp = await createTestImage('webp', 640, 480);
    const orphanPng = await createTestImage('png', 300, 200);

    const env = createInMemoryAdapters({
      buckets: {
        media: {
          'profiles/u1/pic.jpg': smallAvatarJpeg,
          'publications/inline/u1/fig.webp': existingInlineWebp,
        },
        'imagenes-articulos': {
          'portadas/big.png': largeCoverPng,
          'old/unused.png': orphanPng,
        },
      },
      users: [
        {
          id: 'u1',
          avatar_url:
            'https://pzupxjsprmuudmvhzpxu.supabase.co/storage/v1/object/public/media/profiles/u1/pic.jpg',
        },
        {
          id: 'u-ext',
          avatar_url: 'https://lh3.googleusercontent.com/a/oauth-pic',
        },
      ],
      publications: [
        {
          id: 'p1',
          cover_image_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/big.png',
          content: {
            gl: '<p>GL</p><img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/inline/u1/fig.webp">',
            es: '<p>ES</p><img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/inline/u1/fig.webp">',
          },
        },
      ],
    });

    const manifest = await runMigrate({
      storage: env.storage,
      db: env.db,
      httpVerifier: env.httpVerifier,
    });

    expect(manifest.dryRun).toBe(false);
    expect(env.getTransactionCount()).toBe(1);
    expect(manifest.verification?.passed).toBe(true);
    expect(manifest.verification?.remainingLegacyRefs).toEqual([]);
    expect(manifest.verification?.failedUrls).toEqual([]);

    // Small JPEG avatar converted to WebP without upscaling (stays 240x240)
    const avatarEntry = manifest.mappings.find((m) => m.entityId === 'u1')!;
    const avatarBuf = await env.storage.downloadObject('media', avatarEntry.targetPath);
    const avatarMeta = await sharp(avatarBuf).metadata();
    expect(avatarMeta.format).toBe('webp');
    expect(avatarMeta.width).toBe(240);
    expect(avatarMeta.height).toBe(240);

    // Oversized PNG cover converted to WebP and downscaled to <= 1600x1200
    const coverEntry = manifest.mappings.find((m) => m.category === 'publication_cover')!;
    const coverBuf = await env.storage.downloadObject('media', coverEntry.targetPath);
    const coverMeta = await sharp(coverBuf).metadata();
    expect(coverMeta.format).toBe('webp');
    expect(coverMeta.width).toBeLessThanOrEqual(1600);
    expect(coverMeta.height).toBeLessThanOrEqual(1200);

    // Already-WebP inline image copied byte-for-byte without re-encoding
    const inlineEntry = manifest.mappings.find((m) => m.category === 'publication_inline')!;
    const inlineBuf = await env.storage.downloadObject('media', inlineEntry.targetPath);
    expect(inlineBuf.equals(existingInlineWebp)).toBe(true);

    // Orphan PNG converted to WebP under _orphans/
    const orphanEntry = manifest.orphans[0];
    const orphanBuf = await env.storage.downloadObject('media', orphanEntry.targetPath);
    const orphanMeta = await sharp(orphanBuf).metadata();
    expect(orphanMeta.format).toBe('webp');

    // External URL untouched in DB
    const extUser = env.getUsers().find((u) => u.id === 'u-ext');
    expect(extUser?.avatar_url).toBe('https://lh3.googleusercontent.com/a/oauth-pic');

    // Both gl and es in p1 updated to the same canonical inline URL
    const p1 = env.getPublications().find((p) => p.id === 'p1')!;
    expect(p1.content?.gl).toContain(inlineEntry.newUrl);
    expect(p1.content?.es).toContain(inlineEntry.newUrl);
  });

  it('is idempotent on re-run: skips already-migrated objects and performs zero DB writes', async () => {
    const avatarJpeg = await createTestImage('jpeg', 200, 200);
    const env = createInMemoryAdapters({
      buckets: {
        media: { 'profiles/u1/avatar.jpg': avatarJpeg },
        'imagenes-articulos': {},
      },
      users: [
        {
          id: 'u1',
          avatar_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/profiles/u1/avatar.jpg',
        },
      ],
      publications: [],
    });

    const first = await runMigrate({
      storage: env.storage,
      db: env.db,
      httpVerifier: env.httpVerifier,
    });
    expect(first.verification?.passed).toBe(true);
    const uploadsAfterFirst = env.getUploadCount();
    const txAfterFirst = env.getTransactionCount();

    const second = await runMigrate({
      storage: env.storage,
      db: env.db,
      httpVerifier: env.httpVerifier,
    });
    expect(second.verification?.passed).toBe(true);
    expect(second.dbUpdates).toEqual({ userCount: 0, publicationCount: 0 });
    expect(env.getTransactionCount()).toBe(txAfterFirst);
    // Only the old legacy file (now unreferenced) is orphaned once; canonical avatar is skipped
    expect(second.mappings.every((m) => m.skipped === true)).toBe(true);
    expect(second.orphans).toHaveLength(1);
    expect(second.orphans[0].targetPath).toMatch(
      /^_orphans\/media\/profiles\/u1\/avatar\.jpg-[a-f0-9]{10}\.webp$/
    );
    expect(env.getUploadCount()).toBe(uploadsAfterFirst + 1);
    const quarantinedBuf = await env.storage.downloadObject('media', second.orphans[0].targetPath);
    const quarantinedMeta = await sharp(quarantinedBuf).metadata();
    expect(quarantinedMeta.format).toBe('webp');
  });

  it('enforces cleanup guardrails (dry-run, failed verification, query-string variant, orphan still referenced) and cleans up on a real verified manifest', async () => {
    const avatarJpeg = await createTestImage('jpeg', 200, 200);
    const coverPng = await createTestImage('png', 400, 300);
    const orphanJpeg = await createTestImage('jpeg', 150, 150);

    const env = createInMemoryAdapters({
      buckets: {
        media: {
          'profiles/u1/avatar.jpg': avatarJpeg,
          'profiles/u2/unused.jpg': orphanJpeg,
        },
        'imagenes-articulos': { 'portadas/cover.png': coverPng },
      },
      users: [
        {
          id: 'u1',
          avatar_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/profiles/u1/avatar.jpg',
        },
      ],
      publications: [
        {
          id: 'p1',
          cover_image_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/cover.png',
          content: { gl: '<p>ok</p>' },
        },
      ],
    });

    // Guardrail: dry-run manifest rejected
    const dryManifest = await runMigrate({
      storage: env.storage,
      db: env.db,
      httpVerifier: env.httpVerifier,
      dryRun: true,
    });
    await expect(
      runCleanup({ manifest: dryManifest, storage: env.storage, db: env.db })
    ).rejects.toThrow(CleanupGuardrailError);

    // Guardrail: failed verification rejected
    const failedVerifyManifest = await runMigrate({
      storage: env.storage,
      db: env.db,
      httpVerifier: async () => ({ status: 500, contentType: 'text/plain' }),
    });
    expect(failedVerifyManifest.verification?.passed).toBe(false);
    await expect(
      runCleanup({ manifest: failedVerifyManifest, storage: env.storage, db: env.db })
    ).rejects.toThrow(CleanupGuardrailError);

    // Run a real verified migration on a clean environment
    const cleanEnv = createInMemoryAdapters({
      buckets: {
        media: {
          'profiles/u1/avatar.jpg': avatarJpeg,
          'profiles/u2/unused.jpg': orphanJpeg,
        },
        'imagenes-articulos': { 'portadas/cover.png': coverPng },
      },
      users: [
        {
          id: 'u1',
          avatar_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/profiles/u1/avatar.jpg',
        },
      ],
      publications: [
        {
          id: 'p1',
          cover_image_url:
            'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/cover.png',
          content: { gl: '<p>ok</p>' },
        },
      ],
    });

    const verifiedManifest = await runMigrate({
      storage: cleanEnv.storage,
      db: cleanEnv.db,
      httpVerifier: cleanEnv.httpVerifier,
    });
    expect(verifiedManifest.verification?.passed).toBe(true);

    // Guardrail: refuse cleanup if a query-string variant of a superseded path is still referenced
    const originalAvatar = cleanEnv.getUsers()[0].avatar_url;
    cleanEnv.getUsers()[0].avatar_url =
      'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/profiles/u1/avatar.jpg?v=99';
    await expect(
      runCleanup({ manifest: verifiedManifest, storage: cleanEnv.storage, db: cleanEnv.db })
    ).rejects.toThrow(CleanupGuardrailError);

    // Guardrail: refuse cleanup if an orphan source key was subsequently referenced
    cleanEnv.getUsers()[0].avatar_url =
      'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/profiles/u2/unused.jpg';
    await expect(
      runCleanup({ manifest: verifiedManifest, storage: cleanEnv.storage, db: cleanEnv.db })
    ).rejects.toThrow(CleanupGuardrailError);

    // Restore canonical DB state and execute clean cleanup
    cleanEnv.getUsers()[0].avatar_url = originalAvatar;
    const result = await runCleanup({
      manifest: verifiedManifest,
      storage: cleanEnv.storage,
      db: cleanEnv.db,
    });

    expect(result.removedMediaPaths).toEqual(['profiles/u1/avatar.jpg', 'profiles/u2/unused.jpg']);
    expect(result.deletedLegacyBuckets).toEqual(['imagenes-articulos']);
    expect(await cleanEnv.storage.bucketExists('imagenes-articulos')).toBe(false);

    // Canonical migrated assets remain intact in media
    const remainingMedia = await cleanEnv.storage.listObjects('media');
    expect(remainingMedia.some((p) => p.startsWith('users/u1/avatar-'))).toBe(true);
    expect(remainingMedia.some((p) => p.startsWith('publications/p1/cover-'))).toBe(true);
  });

  it('parses and rewrites HTML <img> src safely (ignoring data-src, handling whitespace around = and multiline attributes)', async () => {
    const inlineJpeg = await createTestImage('jpeg', 400, 300);
    const dataSrcOnlyJpeg = await createTestImage('jpeg', 200, 200);
    const legacyUrl =
      'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/contenido/photo.jpg';
    const dataSrcUrl =
      'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/profiles/unused/data-only.jpg';

    const env = createInMemoryAdapters({
      buckets: {
        media: {
          'profiles/unused/data-only.jpg': dataSrcOnlyJpeg,
        },
        'imagenes-articulos': {
          'contenido/photo.jpg': inlineJpeg,
        },
      },
      users: [],
      publications: [
        {
          id: 'pub-html',
          cover_image_url: null,
          content: {
            gl: `<figure><img\n  data-src="${dataSrcUrl}"\n  src =\n  "${legacyUrl}"\n  alt="test"\n/><img src='${legacyUrl}' /></figure>`,
          },
        },
      ],
    });

    const manifest = await runMigrate({
      storage: env.storage,
      db: env.db,
      httpVerifier: env.httpVerifier,
    });

    expect(manifest.verification?.passed).toBe(true);
    // Only the actual img src should be mapped; data-src-only image becomes an orphan
    expect(manifest.mappings).toHaveLength(1);
    expect(manifest.orphans.some((o) => o.sourcePath === 'profiles/unused/data-only.jpg')).toBe(
      true
    );

    const updatedHtml = env.getPublications()[0].content?.gl ?? '';
    expect(updatedHtml).toContain(`data-src="${dataSrcUrl}"`);
    expect(updatedHtml).toContain(`src="${manifest.mappings[0].newUrl}"`);
    expect(updatedHtml).toContain(`src='${manifest.mappings[0].newUrl}'`);
    expect(updatedHtml).not.toContain(`src =\n  "${legacyUrl}"`);
  });

  it('assigns distinct orphan quarantine keys when a.jpg and a.jpg.webp both exist', async () => {
    const jpgBuf = await createTestImage('jpeg', 200, 200);
    const webpBuf = await createTestImage('webp', 200, 200);

    const env = createInMemoryAdapters({
      buckets: {
        media: {
          'old/a.jpg': jpgBuf,
          'old/a.jpg.webp': webpBuf,
        },
        'imagenes-articulos': {},
      },
      users: [],
      publications: [],
    });

    const manifest = await runMigrate({
      storage: env.storage,
      db: env.db,
      httpVerifier: env.httpVerifier,
    });

    expect(manifest.orphans).toHaveLength(2);
    expect(manifest.orphans[0].targetPath).not.toBe(manifest.orphans[1].targetPath);
    expect(new Set(manifest.orphans.map((o) => o.targetPath)).size).toBe(2);
  });

  it('resolves the same legacy URL used for both cover and inline in one publication to separate canonical target paths', async () => {
    const sharedJpeg = await createTestImage('jpeg', 500, 400);
    const sharedUrl =
      'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/imagenes-articulos/shared/pic.jpg';

    const env = createInMemoryAdapters({
      buckets: {
        media: {},
        'imagenes-articulos': {
          'shared/pic.jpg': sharedJpeg,
        },
      },
      users: [],
      publications: [
        {
          id: 'pub-both',
          cover_image_url: sharedUrl,
          content: {
            gl: `<p>Body</p><img src="${sharedUrl}" />`,
          },
        },
      ],
    });

    const manifest = await runMigrate({
      storage: env.storage,
      db: env.db,
      httpVerifier: env.httpVerifier,
    });

    expect(manifest.verification?.passed).toBe(true);
    const coverMapping = manifest.mappings.find((m) => m.category === 'publication_cover')!;
    const inlineMapping = manifest.mappings.find((m) => m.category === 'publication_inline')!;
    expect(coverMapping.targetPath).toMatch(/^publications\/pub-both\/cover-migrated-.*\.webp$/);
    expect(inlineMapping.targetPath).toMatch(/^publications\/pub-both\/inline\/.*-migrated-.*\.webp$/);
    expect(coverMapping.newUrl).not.toBe(inlineMapping.newUrl);

    const pub = env.getPublications()[0];
    expect(pub.cover_image_url).toBe(coverMapping.newUrl);
    expect(pub.content?.gl).toContain(`src="${inlineMapping.newUrl}"`);
  });

  it('rejects corrupt WebP payloads during pixel decode check', async () => {
    const corruptWebp = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8 \x14\x00\x00\x00corruptdata');
    await expect(processImageForMigration(corruptWebp, 'publication_cover')).rejects.toThrow();
  });
});
