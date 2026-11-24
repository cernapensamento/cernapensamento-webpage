#!/usr/bin/env node
/**
 * Two-Phase Idempotent Storage Migration CLI (`migrate` & `cleanup`)
 *
 * Usage:
 *   node scripts/migrate-storage.ts migrate [--dry-run] [--manifest <path>]
 *   node scripts/migrate-storage.ts cleanup --manifest <path>
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
        if (error.message.toLowerCase().includes('not found')) {
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
      return !error && Boolean(data);
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
        cacheControl: options.cacheControl,
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
  return {
    async fetchUsers(): Promise<MigrationUserRow[]> {
      const { data, error } = await supabase
        .from(DB_TABLES.USERS)
        .select(`${USER_COLS.ID}, ${USER_COLS.AVATAR_URL}`);
      if (error) throw new Error(`Failed to fetch users: ${error.message}`);
      return (data ?? []) as MigrationUserRow[];
    },
    async fetchPublications(): Promise<MigrationPublicationRow[]> {
      const { data, error } = await supabase
        .from(DB_TABLES.PUBLICATIONS)
        .select(
          `${PUBLICATION_COLS.ID}, ${PUBLICATION_COLS.COVER_IMAGE_URL}, ${PUBLICATION_COLS.CONTENT}`
        );
      if (error) throw new Error(`Failed to fetch publications: ${error.message}`);
      return (data ?? []) as MigrationPublicationRow[];
    },
    async applyUpdatesInTransaction(updates: MigrationDbUpdates): Promise<void> {
      if (!databaseUrl) {
        throw new Error(
          'DATABASE_URL is required to apply live database updates atomically in a single transaction.'
        );
      }

      const statements: string[] = ['BEGIN;'];
      for (const u of updates.users) {
        statements.push(
          `UPDATE public.${DB_TABLES.USERS} SET ${USER_COLS.AVATAR_URL} = ${sqlLiteral(
            u.avatar_url
          )} WHERE ${USER_COLS.ID} = ${sqlLiteral(u.id)};`
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
          statements.push(
            `UPDATE public.${DB_TABLES.PUBLICATIONS} SET ${sets.join(', ')} WHERE ${
              PUBLICATION_COLS.ID
            } = ${sqlLiteral(p.id)};`
          );
        }
      }
      statements.push('COMMIT;');
      execFileSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1'], {
        input: statements.join('\n'),
        stdio: ['pipe', 'inherit', 'inherit'],
      });
    },
  };
}

const liveHttpVerifier: HttpVerifier = async (url) => {
  let res = await fetch(url, { method: 'HEAD' });
  if (res.status === 405) {
    res = await fetch(url, { method: 'GET' });
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

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--manifest' && argv[i + 1]) {
      manifestPath = resolve(process.cwd(), argv[i + 1]);
      i += 1;
    }
  }

  return { command, dryRun, manifestPath };
}

async function main() {
  loadEnvIfPresent();
  const { command, dryRun, manifestPath } = parseArgs(process.argv.slice(2));

  if (command !== 'migrate' && command !== 'cleanup') {
    console.error(
      'Usage:\n  node scripts/migrate-storage.ts migrate [--dry-run] [--manifest <path>]\n  node scripts/migrate-storage.ts cleanup --manifest <path>'
    );
    process.exit(1);
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

  if (!existsSync(manifestPath)) {
    console.error(`Manifest file not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as MigrationManifest;
  const result = await runCleanup({ manifest, storage, db });
  console.log(JSON.stringify({ command: 'cleanup', manifestPath, ...result }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
