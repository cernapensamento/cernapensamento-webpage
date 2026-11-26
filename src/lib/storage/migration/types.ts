import type { StorageCategory } from '../constants';

export interface MigrationUserRow {
  id: string;
  avatar_url: string | null;
}

export interface MigrationPublicationRow {
  id: string;
  cover_image_url: string | null;
  content: Record<string, string | null | undefined> | null;
}

export interface MigrationDbUpdates {
  users: Array<{ id: string; avatar_url: string }>;
  publications: Array<{
    id: string;
    cover_image_url?: string;
    content?: Record<string, string | null | undefined>;
    originalCoverImageUrl: string | null;
    originalContent: Record<string, string | null | undefined> | null;
  }>;
}

export interface MigrationStorageAdapter {
  bucketExists(bucket: string): Promise<boolean>;
  listObjects(bucket: string): Promise<string[]>;
  downloadObject(bucket: string, path: string): Promise<Buffer>;
  uploadObject(
    bucket: string,
    path: string,
    body: Buffer,
    options: { contentType: string; cacheControl: string }
  ): Promise<void>;
  removeObjects(bucket: string, paths: string[]): Promise<void>;
  deleteBucket(bucket: string): Promise<void>;
  getPublicUrl(bucket: string, path: string): string;
}

export interface MigrationDbAdapter {
  fetchUsers(): Promise<MigrationUserRow[]>;
  fetchPublications(): Promise<MigrationPublicationRow[]>;
  applyUpdatesInTransaction(updates: MigrationDbUpdates): Promise<void>;
}

export type HttpVerifier = (
  url: string
) => Promise<{ status: number; contentType: string | null; error?: string }>;

export type MigrationAction = 'copy_webp' | 'convert_webp' | 'already_canonical';

export interface MigrationMappingEntry {
  oldUrl: string;
  newUrl: string;
  sourceBucket: string;
  sourcePath: string;
  targetPath: string;
  category: StorageCategory;
  entityId: string;
  action: MigrationAction;
  skipped?: boolean;
}

export interface MigrationOrphanEntry {
  sourceBucket: string;
  sourcePath: string;
  targetPath: string;
  action: 'copy_webp' | 'convert_webp';
  skipped?: boolean;
}

export interface MigrationVerificationReport {
  passed: boolean;
  verifiedAt: string;
  checkedUrls: number;
  failedUrls: Array<{
    url: string;
    status: number;
    contentType: string | null;
    error?: string;
  }>;
  remainingLegacyRefs: string[];
}

export interface MigrationManifest {
  version: 1;
  generatedAt: string;
  dryRun: boolean;
  sourceBuckets: string[];
  targetBucket: string;
  currentHost: string;
  legacyHost: string;
  mappings: MigrationMappingEntry[];
  orphans: MigrationOrphanEntry[];
  externalUrls: string[];
  dbUpdates: {
    userCount: number;
    publicationCount: number;
  };
  verification?: MigrationVerificationReport;
}

export interface MigrateOptions {
  storage: MigrationStorageAdapter;
  db: MigrationDbAdapter;
  httpVerifier: HttpVerifier;
  currentHost?: string;
  legacyHost?: string;
  dryRun?: boolean;
  now?: Date;
}

export interface CleanupOptions {
  manifest: MigrationManifest;
  storage: MigrationStorageAdapter;
  db: MigrationDbAdapter;
}

export interface CleanupResult {
  removedMediaPaths: string[];
  removedLegacyBucketPaths: string[];
  deletedLegacyBuckets: string[];
}

export class MissingStorageObjectsError extends Error {
  public readonly missing: Array<{
    entityType: 'user' | 'publication';
    entityId: string;
    field: string;
    url: string;
    bucket: string;
    path: string;
  }>;

  constructor(
    missing: Array<{
      entityType: 'user' | 'publication';
      entityId: string;
      field: string;
      url: string;
      bucket: string;
      path: string;
    }>
  ) {
    super(
      `Missing ${missing.length} referenced storage object(s): ${missing
        .map((m) => `${m.bucket}/${m.path} (${m.entityType}:${m.entityId})`)
        .join(', ')}`
    );
    this.name = 'MissingStorageObjectsError';
    this.missing = missing;
  }
}

export class CleanupGuardrailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CleanupGuardrailError';
  }
}
