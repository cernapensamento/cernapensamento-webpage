#!/usr/bin/env node
/**
 * Two-Phase Idempotent Storage Migration CLI (`migrate` & `cleanup`)
 *
 * Usage:
 *   npm run storage:migrate -- migrate [--dry-run] [--manifest <path>]
 *   npm run storage:migrate -- cleanup --manifest <path>
 *   (or: npx tsx scripts/migrate-storage.ts ...)
 *
 * Environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL    Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   Supabase service_role key (required for storage & DB)
 *   DATABASE_URL                Required for live migrate: Postgres connection string for single-transaction SQL updates via psql
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, PUBLICATION_COLS, USER_COLS } from '../src/lib/db/schema';
import {
  runCleanup,
  runMigrate,
  type HttpVerifier,
  type MigrationDbAdapter,
  type MigrationDbUpdates,
  type MigrationManifest,
  type MigrationPublicationRow,
  type MigrationStorageAdapter,
  type MigrationUserRow,
} from '../src/lib/storage/migration';

const USAGE =
  'Usage:\n' +
  '  npm run storage:migrate -- migrate [--dry-run] [--manifest <path>]\n' +
  '  npm run storage:migrate -- cleanup --manifest <path>\n' +
  '  (or: npx tsx scripts/migrate-storage.ts ...)';

function loadEnvIfPresent(): void {
  const envPath = resolve(process.cwd(), '.env.local');
  if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // Ignore malformed lines if already set in environment
    }
  }
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function chooseDollarTag(body: string): string {
  let index = 0;
  let tag = '$cerna_tx$';
  while (body.includes(tag)) {
    index += 1;
    tag = `$cerna_tx_${index}$`;
  }
  return tag;
}

function isMissingBucketError(error: {
  message?: string;
  statusCode?: string | number;
  status?: number;
}): boolean {
  const msg = (error.message ?? '').toLowerCase();
  const status = error.statusCode ?? error.status;
  return (
    msg.includes('not found') ||
    msg.includes('does not exist') ||
    status === 404 ||
    status === '404'
  );
}

function toSupabaseCacheControlSeconds(cacheControl: string): string {
  const trimmed = cacheControl.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/max-age=(\d+)/i);
  return match ? match[1] : '31536000';
}

function buildPsqlEnv(databaseUrl: string): NodeJS.ProcessEnv {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL.');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error(`Unsupported DATABASE_URL protocol: ${parsed.protocol}`);
  }

  const env: NodeJS.ProcessEnv = { ...process.env };
  env.PGHOST = parsed.hostname || 'localhost';
  env.PGPORT = parsed.port || '5432';
  const dbName = parsed.pathname.replace(/^\/+/, '');
  env.PGDATABASE = dbName ? decodeURIComponent(dbName) : 'postgres';
  env.PGUSER = parsed.username ? decodeURIComponent(parsed.username) : 'postgres';

  if (parsed.password) {
    env.PGPASSWORD = decodeURIComponent(parsed.password);
  }

  const sslMode = parsed.searchParams.get('sslmode');
  if (sslMode) {
    env.PGSSLMODE = sslMode;
  }

  return env;
}

function extractSupabaseRefFromUrl(supabaseUrl: string): string | null {
  const host = new URL(supabaseUrl).hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/);
  return match ? match[1] : null;
}

function extractSupabaseRefFromDbUrl(databaseUrl: string): string | null {
  const parsed = new URL(databaseUrl);
  const host = parsed.hostname.toLowerCase();
  const directMatch = host.match(/^db\.([a-z0-9-]+)\.supabase\.co$/);
  if (directMatch) return directMatch[1];

  if (host.endsWith('.pooler.supabase.com') || host.endsWith('.pooler.supabase.co')) {
    const user = decodeURIComponent(parsed.username || '');
    const parts = user.split('.');
    if (parts.length >= 2 && parts[1]) {
      return parts[1].toLowerCase();
    }
  }

  return null;
}

async function verifyLiveMigratePrerequisites(
  supabase: SupabaseClient,
  supabaseUrl: string,
  databaseUrl: string | undefined
): Promise<void> {
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required for live migrate so database updates run atomically in a single transaction.'
    );
  }

  try {
    execFileSync('psql', ['--version'], { stdio: 'pipe' });
  } catch (err) {
    throw new Error(
      `psql CLI is required for live migrate but failed to execute: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  const psqlEnv = buildPsqlEnv(databaseUrl);

  const supabaseRef = extractSupabaseRefFromUrl(supabaseUrl);
  const dbRef = extractSupabaseRefFromDbUrl(databaseUrl);
  if (supabaseRef && dbRef && supabaseRef !== dbRef) {
    throw new Error(
      `Project mismatch: NEXT_PUBLIC_SUPABASE_URL targets "${supabaseRef}" while DATABASE_URL targets "${dbRef}".`
    );
  }

  const psqlResult = execFileSync(
    'psql',
    [
      '-v',
      'ON_ERROR_STOP=1',
      '-t',
      '-A',
      '-c',
      `SELECT (SELECT count(*)::int FROM public.${DB_TABLES.PUBLICATIONS}) || '|' || COALESCE((SELECT string_agg(${PUBLICATION_COLS.ID}::text, ',') FROM (SELECT ${PUBLICATION_COLS.ID} FROM public.${DB_TABLES.PUBLICATIONS} ORDER BY ${PUBLICATION_COLS.ID} ASC LIMIT 5) s), '');`,
    ],
    { env: psqlEnv, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();

  const [psqlCountRaw, psqlIdsRaw = ''] = psqlResult.split('|');
  const psqlCount = Number.parseInt(psqlCountRaw, 10);

  const [{ count: restCount, error: countError }, { data: restSample, error: sampleError }] =
    await Promise.all([
      supabase
        .from(DB_TABLES.PUBLICATIONS)
        .select(PUBLICATION_COLS.ID, { count: 'exact', head: true }),
      supabase
        .from(DB_TABLES.PUBLICATIONS)
        .select(PUBLICATION_COLS.ID)
        .order(PUBLICATION_COLS.ID, { ascending: true })
        .limit(5),
    ]);

  if (countError || sampleError) {
    throw new Error(
      `Failed to verify Supabase REST database identity: ${
        countError?.message ?? sampleError?.message
      }`
    );
  }

  const restIds = (restSample ?? [])
    .map((row) => String((row as Record<string, unknown>)[PUBLICATION_COLS.ID]))
    .join(',');

  if (psqlCount !== restCount || psqlIdsRaw !== restIds) {
    throw new Error(
      `Database identity mismatch between NEXT_PUBLIC_SUPABASE_URL (count=${restCount}, sample=[${restIds}]) and DATABASE_URL (count=${psqlCount}, sample=[${psqlIdsRaw}]). Aborting before any write.`
    );
  }
}

function createSupabaseStorageAdapter(supabase: SupabaseClient): MigrationStorageAdapter {
  async function listRecursive(bucket: string, prefix = ''): Promise<string[]> {
    const results: string[] = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) {
        if (isMissingBucketError(error)) {
          return [];
        }
        throw new Error(`Failed to list ${bucket}/${prefix}: ${error.message}`);
      }

      if (!data || data.length === 0) break;

      for (const item of data) {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) {
          // Folder
          const nested = await listRecursive(bucket, fullPath);
          results.push(...nested);
        } else {
          results.push(fullPath);
        }
      }

      if (data.length < limit) break;
      offset += limit;
    }

    return results;
  }

  return {
    async bucketExists(bucket) {
      const { data, error } = await supabase.storage.getBucket(bucket);
      if (!error) return Boolean(data);
      if (isMissingBucketError(error)) {
        return false;
      }
      throw new Error(`Failed to check bucket ${bucket}: ${error.message}`);
    },
    async listObjects(bucket) {
      const exists = await this.bucketExists(bucket);
      if (!exists) return [];
      return listRecursive(bucket);
    },
    async downloadObject(bucket, path) {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error || !data) {
        throw new Error(`Failed to download ${bucket}/${path}: ${error?.message ?? 'empty body'}`);
      }
      return Buffer.from(await data.arrayBuffer());
    },
    async uploadObject(bucket, path, body, options) {
      const { error } = await supabase.storage.from(bucket).upload(path, body, {
        contentType: options.contentType,
        cacheControl: toSupabaseCacheControlSeconds(options.cacheControl),
        upsert: true,
      });
      if (error) {
        throw new Error(`Failed to upload ${bucket}/${path}: ${error.message}`);
      }
    },
    async removeObjects(bucket, paths) {
      const chunkSize = 100;
      for (let i = 0; i < paths.length; i += chunkSize) {
        const chunk = paths.slice(i, i + chunkSize);
        const { error } = await supabase.storage.from(bucket).remove(chunk);
        if (error) {
          throw new Error(`Failed to remove objects from ${bucket}: ${error.message}`);
        }
      }
    },
    async deleteBucket(bucket) {
      const { error } = await supabase.storage.deleteBucket(bucket);
      if (error) {
        throw new Error(`Failed to delete bucket ${bucket}: ${error.message}`);
      }
    },
    getPublicUrl(bucket, path) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
  };
}

function createSupabaseDbAdapter(
  supabase: SupabaseClient,
  databaseUrl?: string
): MigrationDbAdapter {
  async function fetchAllPaginated<T>(
    table: string,
    selectCols: string,
    idCol: string
  ): Promise<T[]> {
    const pageSize = 1000;
    const rows: T[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(selectCols)
        .order(idCol, { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        throw new Error(`Failed to fetch ${table}: ${error.message}`);
      }

      const batch = (data ?? []) as T[];
      rows.push(...batch);
      if (batch.length < pageSize) {
        break;
      }
      from += pageSize;
    }

    return rows;
  }

  return {
    async fetchUsers(): Promise<MigrationUserRow[]> {
      return fetchAllPaginated<MigrationUserRow>(
        DB_TABLES.USERS,
        `${USER_COLS.ID}, ${USER_COLS.AVATAR_URL}`,
        USER_COLS.ID
      );
    },
    async fetchPublications(): Promise<MigrationPublicationRow[]> {
      return fetchAllPaginated<MigrationPublicationRow>(
        DB_TABLES.PUBLICATIONS,
        `${PUBLICATION_COLS.ID}, ${PUBLICATION_COLS.COVER_IMAGE_URL}, ${PUBLICATION_COLS.CONTENT}`,
        PUBLICATION_COLS.ID
      );
    },
    async applyUpdatesInTransaction(updates: MigrationDbUpdates): Promise<void> {
      if (!databaseUrl) {
        throw new Error(
          'DATABASE_URL is required to apply live database updates atomically in a single transaction.'
        );
      }

      const psqlEnv = buildPsqlEnv(databaseUrl);
      const blockStatements: string[] = [];

      for (const u of updates.users) {
        blockStatements.push(
          `UPDATE public.${DB_TABLES.USERS} SET ${USER_COLS.AVATAR_URL} = ${sqlLiteral(
            u.avatar_url
          )} WHERE ${USER_COLS.ID} = ${sqlLiteral(u.id)};`,
          `IF NOT FOUND THEN RAISE EXCEPTION 'User % not found during migration update', ${sqlLiteral(
            u.id
          )}; END IF;`
        );
      }

      for (const p of updates.publications) {
        const sets: string[] = [];
        if (p.cover_image_url !== undefined) {
          sets.push(
            `${PUBLICATION_COLS.COVER_IMAGE_URL} = ${sqlLiteral(p.cover_image_url)}`
          );
        }
        if (p.content !== undefined) {
          sets.push(
            `${PUBLICATION_COLS.CONTENT} = ${sqlLiteral(JSON.stringify(p.content))}::jsonb`
          );
        }
        if (sets.length > 0) {
          const expectedCover =
            p.originalCoverImageUrl === null ? 'NULL' : sqlLiteral(p.originalCoverImageUrl);
          const expectedContent =
            p.originalContent === null
              ? 'NULL'
              : `${sqlLiteral(JSON.stringify(p.originalContent))}::jsonb`;

          blockStatements.push(
            `UPDATE public.${DB_TABLES.PUBLICATIONS} SET ${sets.join(', ')} WHERE ${
              PUBLICATION_COLS.ID
            } = ${sqlLiteral(p.id)} AND ${
              PUBLICATION_COLS.COVER_IMAGE_URL
            } IS NOT DISTINCT FROM ${expectedCover} AND ${
              PUBLICATION_COLS.CONTENT
            } IS NOT DISTINCT FROM ${expectedContent};`,
            `IF NOT FOUND THEN RAISE EXCEPTION 'Optimistic concurrency conflict: publication % changed since migration scan', ${sqlLiteral(
              p.id
            )}; END IF;`
          );
        }
      }

      const body = blockStatements.join('\n  ');
      const tag = chooseDollarTag(body);
      const sql = ['BEGIN;', `DO ${tag}`, 'BEGIN', `  ${body}`, `END ${tag};`, 'COMMIT;'].join(
        '\n'
      );

      execFileSync('psql', ['-v', 'ON_ERROR_STOP=1'], {
        env: psqlEnv,
        input: sql,
        stdio: ['pipe', 'inherit', 'inherit'],
      });
    },
  };
}

const liveHttpVerifier: HttpVerifier = async (url) => {
  let res = await fetch(url, {
    method: 'HEAD',
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 405) {
    res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    });
  }
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
  };
};

function parseArgs(argv: string[]) {
  const command = argv[0];
  let dryRun = false;
  let manifestPath = resolve(process.cwd(), 'storage-migration-manifest.json');
  let manifestExplicit = false;

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--manifest') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Flag --manifest requires a file path argument.');
      }
      manifestPath = resolve(process.cwd(), next);
      manifestExplicit = true;
      i += 1;
    } else {
      throw new Error(`Unknown CLI argument: ${arg}`);
    }
  }

  return { command, dryRun, manifestPath, manifestExplicit };
}

function validateCleanupManifest(raw: unknown, expectedHost: string): MigrationManifest {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid manifest: expected JSON object.');
  }

  const m = raw as Record<string, unknown>;
  if (m.version !== 1) {
    throw new Error(`Invalid manifest version: expected 1, got ${String(m.version)}.`);
  }
  if (typeof m.dryRun !== 'boolean') {
    throw new Error('Invalid manifest: missing boolean "dryRun".');
  }
  if (!Array.isArray(m.sourceBuckets) || !m.sourceBuckets.every((b) => typeof b === 'string')) {
    throw new Error('Invalid manifest: "sourceBuckets" must be a string array.');
  }
  if (typeof m.targetBucket !== 'string' || !m.targetBucket) {
    throw new Error('Invalid manifest: "targetBucket" must be a non-empty string.');
  }
  if (typeof m.currentHost !== 'string' || !m.currentHost) {
    throw new Error('Invalid manifest: "currentHost" must be a non-empty string.');
  }
  if (typeof m.legacyHost !== 'string') {
    throw new Error('Invalid manifest: "legacyHost" must be a string.');
  }
  if (!Array.isArray(m.mappings) || !Array.isArray(m.orphans)) {
    throw new Error('Invalid manifest: "mappings" and "orphans" must be arrays.');
  }
  for (const entry of m.mappings) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof (entry as Record<string, unknown>).oldUrl !== 'string' ||
      typeof (entry as Record<string, unknown>).newUrl !== 'string' ||
      typeof (entry as Record<string, unknown>).sourceBucket !== 'string' ||
      typeof (entry as Record<string, unknown>).sourcePath !== 'string' ||
      typeof (entry as Record<string, unknown>).targetPath !== 'string'
    ) {
      throw new Error('Invalid manifest: malformed entry in "mappings".');
    }
  }
  for (const orphan of m.orphans) {
    if (
      !orphan ||
      typeof orphan !== 'object' ||
      typeof (orphan as Record<string, unknown>).sourceBucket !== 'string' ||
      typeof (orphan as Record<string, unknown>).sourcePath !== 'string' ||
      typeof (orphan as Record<string, unknown>).targetPath !== 'string'
    ) {
      throw new Error('Invalid manifest: malformed entry in "orphans".');
    }
  }
  if (!m.verification || typeof m.verification !== 'object') {
    throw new Error('Invalid manifest: missing "verification" report.');
  }
  const v = m.verification as Record<string, unknown>;
  if (
    typeof v.passed !== 'boolean' ||
    typeof v.checkedUrls !== 'number' ||
    !Array.isArray(v.failedUrls) ||
    !Array.isArray(v.remainingLegacyRefs)
  ) {
    throw new Error('Invalid manifest: malformed "verification" report.');
  }

  if (m.currentHost !== expectedHost) {
    throw new Error(
      `Manifest host mismatch: manifest targets "${m.currentHost}" but NEXT_PUBLIC_SUPABASE_URL targets "${expectedHost}".`
    );
  }

  return raw as MigrationManifest;
}

async function main() {
  loadEnvIfPresent();
  const { command, dryRun, manifestPath, manifestExplicit } = parseArgs(process.argv.slice(2));

  if (command !== 'migrate' && command !== 'cleanup') {
    console.error(USAGE);
    process.exit(1);
  }

  if (command === 'cleanup') {
    if (dryRun) {
      console.error('Flag --dry-run is not supported for cleanup.');
      process.exit(1);
    }
    if (!manifestExplicit) {
      console.error('Cleanup requires an explicit --manifest <path> flag.');
      process.exit(1);
    }
    if (!existsSync(manifestPath)) {
      console.error(`Manifest file not found: ${manifestPath}`);
      process.exit(1);
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
    process.exit(1);
  }

  const currentHost = new URL(supabaseUrl).hostname;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (command === 'migrate' && !dryRun) {
    await verifyLiveMigratePrerequisites(supabase, supabaseUrl, process.env.DATABASE_URL);
  }

  const storage = createSupabaseStorageAdapter(supabase);
  const db = createSupabaseDbAdapter(supabase, process.env.DATABASE_URL);

  if (command === 'migrate') {
    const manifest = await runMigrate({
      storage,
      db,
      httpVerifier: liveHttpVerifier,
      currentHost,
      dryRun,
    });

    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    console.log(
      JSON.stringify(
        {
          command: 'migrate',
          dryRun: manifest.dryRun,
          manifestPath,
          mappings: manifest.mappings.length,
          orphans: manifest.orphans.length,
          externalUrls: manifest.externalUrls.length,
          dbUpdates: manifest.dbUpdates,
          verification: manifest.verification,
        },
        null,
        2
      )
    );

    if (!dryRun && !manifest.verification?.passed) {
      console.error('Migration verification failed. Inspect the manifest before retrying.');
      process.exit(1);
    }
    return;
  }

  const rawManifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
  const manifest = validateCleanupManifest(rawManifest, currentHost);
  const result = await runCleanup({ manifest, storage, db });
  console.log(JSON.stringify({ command: 'cleanup', manifestPath, ...result }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
