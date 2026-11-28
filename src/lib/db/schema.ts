/**
 * Database Schema Constants
 * Standardized English table, column, enum, and relation identifiers.
 * Eliminates all magic/hardcoded strings across the Cerna codebase.
 */

export const DB_TABLES = {
  PUBLICATIONS: 'publications',
  USERS: 'users',
  COMMENTS: 'comments',
  TAGS: 'tags',
  TAG_TRANSLATIONS: 'tag_translations',
  PUBLICATION_TAGS: 'publication_tags',
  ROLES: 'roles',
  ROLE_PERMISSIONS: 'role_permissions',
  USER_ROLES: 'user_roles',
} as const;

export type DbTableName = (typeof DB_TABLES)[keyof typeof DB_TABLES];

export const DB_RPCS = {
  UNSUBSCRIBE_NEWSLETTER_BY_EMAIL: 'unsubscribe_newsletter_by_email',
  GET_SUBSCRIBERS_EMAILS: 'get_subscribers_emails',
} as const;

export const DESK_FILTERS = {
  ALL: 'todos',
  DRAFTS: 'borradores',
  PUBLISHED: 'publicados',
  IN_REVIEW: 'pendientes',
  FOR_APPROVAL: 'para_aprobar',
  VIEW_ALL: 'todo',
} as const;

export const DESK_ERRORS = {
  LIMIT_REACHED: 'limite_alcanzado',
} as const;

export const PUBLICATION_COLS = {
  ID: 'id',
  SLUG: 'slug',
  COVER_IMAGE_URL: 'cover_image_url',
  STATUS: 'status',
  TYPE: 'type',
  ORIGINAL_LANGUAGE: 'original_language',
  IS_PINNED: 'is_pinned',
  SHOW_INDEX: 'show_index',
  AUTHOR_ID: 'author_id',
  TITLE: 'title',
  SUBTITLE: 'subtitle',
  CONTENT: 'content',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  PUBLISHED_AT: 'published_at',
  NEWSLETTER_SENT_AT: 'newsletter_sent_at',
} as const;

export const USER_COLS = {
  ID: 'id',
  FULL_NAME: 'full_name',
  SLUG: 'slug',
  BIO: 'bio',
  AVATAR_URL: 'avatar_url',
  NEWSLETTER_SUBSCRIBED: 'newsletter_subscribed',
} as const;

export const COMMENT_COLS = {
  ID: 'id',
  PUBLICATION_ID: 'publication_id',
  AUTHOR_ID: 'author_id',
  CONTENT: 'content',
  UPDATED_AT: 'updated_at',
} as const;

export const TAG_COLS = {
  ID: 'id',
  SLUG: 'slug',
  CREATED_AT: 'created_at',
} as const;

export const TAG_TRANSLATION_COLS = {
  TAG_ID: 'tag_id',
  LANG: 'lang',
  NAME: 'name',
} as const;

export const PUBLICATION_TAG_COLS = {
  PUBLICATION_ID: 'publication_id',
  TAG_ID: 'tag_id',
} as const;

export const ROLE_COLS = {
  ID: 'id',
  IS_PUBLIC: 'is_public',
  PUBLIC_PRIORITY: 'public_priority',
} as const;

export const ROLE_PERMISSION_COLS = {
  ROLE_ID: 'role_id',
  PERMISSION: 'permission',
} as const;

export const USER_ROLE_COLS = {
  USER_ID: 'user_id',
  ROLE_ID: 'role_id',
  CREATED_AT: 'created_at',
} as const;

export const USER_ROLES = {
  READER: 'reader',
  GUEST: 'guest',
  MEMBER: 'member',
  FOUNDER: 'founder',
  ADMIN: 'admin',
} as const;

export type UserRoleValue = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Canonical 19 atomic resource:action permissions seeded in public.role_permissions.
 */
export const PERMISSIONS = {
  DESK_ACCESS: 'desk:access',
  AI_TRANSLATE: 'ai:translate',
  PUBLICATIONS_CREATE: 'publications:create',
  PUBLICATIONS_UPDATE_OWN: 'publications:update_own',
  PUBLICATIONS_DELETE_OWN: 'publications:delete_own',
  PUBLICATIONS_WRITE_UNLIMITED: 'publications:write_unlimited',
  PUBLICATIONS_REVIEW: 'publications:review',
  PUBLICATIONS_PUBLISH: 'publications:publish',
  PUBLICATIONS_PIN: 'publications:pin',
  PUBLICATIONS_UPDATE_ANY: 'publications:update_any',
  PUBLICATIONS_DELETE_ANY: 'publications:delete_any',
  MEDIA_UPLOAD_PUBLICATION: 'media:upload_publication',
  MEDIA_DELETE_ANY: 'media:delete_any',
  TAGS_CREATE: 'tags:create',
  TAGS_UPDATE: 'tags:update',
  TAGS_DELETE: 'tags:delete',
  COMMENTS_DELETE_ANY: 'comments:delete_any',
  USERS_ASSIGN_ROLE: 'users:assign_role',
  USERS_REVOKE_ROLE: 'users:revoke_role',
} as const;

export type PermissionValue = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const GUEST_PERMISSION_LIST: readonly PermissionValue[] = [
  PERMISSIONS.DESK_ACCESS,
  PERMISSIONS.AI_TRANSLATE,
  PERMISSIONS.PUBLICATIONS_CREATE,
  PERMISSIONS.PUBLICATIONS_UPDATE_OWN,
  PERMISSIONS.PUBLICATIONS_DELETE_OWN,
  PERMISSIONS.MEDIA_UPLOAD_PUBLICATION,
  PERMISSIONS.TAGS_CREATE,
];

const MEMBER_PERMISSION_LIST: readonly PermissionValue[] = [
  ...GUEST_PERMISSION_LIST,
  PERMISSIONS.PUBLICATIONS_WRITE_UNLIMITED,
];

const FOUNDER_PERMISSION_LIST: readonly PermissionValue[] = [
  ...MEMBER_PERMISSION_LIST,
  PERMISSIONS.PUBLICATIONS_REVIEW,
  PERMISSIONS.PUBLICATIONS_PUBLISH,
  PERMISSIONS.PUBLICATIONS_PIN,
  PERMISSIONS.PUBLICATIONS_UPDATE_ANY,
  PERMISSIONS.PUBLICATIONS_DELETE_ANY,
  PERMISSIONS.MEDIA_DELETE_ANY,
  PERMISSIONS.TAGS_UPDATE,
  PERMISSIONS.TAGS_DELETE,
  PERMISSIONS.COMMENTS_DELETE_ANY,
];

const ADMIN_PERMISSION_LIST: readonly PermissionValue[] = [
  ...FOUNDER_PERMISSION_LIST,
  PERMISSIONS.USERS_ASSIGN_ROLE,
  PERMISSIONS.USERS_REVOKE_ROLE,
];

export const ROLE_PERMISSIONS: Readonly<Record<UserRoleValue, readonly PermissionValue[]>> = {
  [USER_ROLES.READER]: [],
  [USER_ROLES.GUEST]: GUEST_PERMISSION_LIST,
  [USER_ROLES.MEMBER]: MEMBER_PERMISSION_LIST,
  [USER_ROLES.FOUNDER]: FOUNDER_PERMISSION_LIST,
  [USER_ROLES.ADMIN]: ADMIN_PERMISSION_LIST,
};

/**
 * Deterministic display priority for public editorial roles (highest to lowest).
 */
export const PUBLIC_ROLE_PRIORITY = [
  USER_ROLES.FOUNDER,
  USER_ROLES.MEMBER,
  USER_ROLES.GUEST,
] as const;

export type PublicRoleValue = (typeof PUBLIC_ROLE_PRIORITY)[number];

export interface RoleMetadata {
  readonly isPublic: boolean;
  readonly publicPriority: number | null;
}

export const ROLE_METADATA: Readonly<Record<UserRoleValue, RoleMetadata>> = {
  [USER_ROLES.FOUNDER]: { isPublic: true, publicPriority: 1 },
  [USER_ROLES.MEMBER]: { isPublic: true, publicPriority: 2 },
  [USER_ROLES.GUEST]: { isPublic: true, publicPriority: 3 },
  [USER_ROLES.ADMIN]: { isPublic: false, publicPriority: null },
  [USER_ROLES.READER]: { isPublic: false, publicPriority: null },
};

export const VALID_ROLE_SET: ReadonlySet<string> = new Set(Object.values(USER_ROLES));
export const VALID_PERMISSION_SET: ReadonlySet<string> = new Set(Object.values(PERMISSIONS));

/**
 * Resolves and deduplicates the union of atomic permissions across assigned roles.
 * Unknown or empty roles fail closed to [].
 */
export function resolvePermissionsForRoles(
  roles?: readonly (UserRoleValue | string)[] | null
): PermissionValue[] {
  if (!roles || roles.length === 0) return [];
  const resolved = new Set<PermissionValue>();
  for (const role of roles) {
    if (typeof role === 'string' && VALID_ROLE_SET.has(role)) {
      for (const perm of ROLE_PERMISSIONS[role as UserRoleValue]) {
        resolved.add(perm);
      }
    }
  }
  return Array.from(resolved);
}

/**
 * Checks whether a permission list grants a single required permission.
 */
export function hasPermission(
  permissions?: readonly (PermissionValue | string)[] | null,
  permission?: PermissionValue | string | null
): boolean {
  if (!permissions || !permission) return false;
  return permissions.includes(permission);
}

/**
 * Checks whether a permission list grants at least one of the required permissions.
 * Empty required lists fail closed (return false).
 */
export function hasAnyPermission(
  permissions?: readonly (PermissionValue | string)[] | null,
  required?: readonly (PermissionValue | string)[] | null
): boolean {
  if (!permissions || !required || required.length === 0) return false;
  return required.some((perm) => permissions.includes(perm));
}

/**
 * Checks whether a permission list grants every one of the required permissions.
 * Empty required lists fail closed (return false).
 */
export function hasAllPermissions(
  permissions?: readonly (PermissionValue | string)[] | null,
  required?: readonly (PermissionValue | string)[] | null
): boolean {
  if (!permissions || !required || required.length === 0) return false;
  return required.every((perm) => permissions.includes(perm));
}

/**
 * Guest Author publication quotas (2/year, 4 total) apply when a user can create
 * publications without holding unlimited publication rights.
 */
export function isGuestQuotaSubject(
  permissions?: readonly (PermissionValue | string)[] | null
): boolean {
  return (
    hasPermission(permissions, PERMISSIONS.PUBLICATIONS_CREATE) &&
    !hasPermission(permissions, PERMISSIONS.PUBLICATIONS_WRITE_UNLIMITED)
  );
}

/**
 * Resolves the highest-priority public editorial role (founder > member > guest),
 * ignoring internal roles such as admin and reader.
 */
export function resolvePrimaryPublicRole(
  roles?: readonly (UserRoleValue | string)[] | null
): PublicRoleValue | null {
  if (!roles || roles.length === 0) return null;
  for (const candidate of PUBLIC_ROLE_PRIORITY) {
    if (roles.includes(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Resolves a localized public editorial badge label from public roles,
 * returning null when the user only holds internal roles (e.g., admin, reader)
 * or no roles at all.
 */
export function resolvePublicAuthorBadge(
  roles?: readonly (UserRoleValue | string)[] | null,
  labels?: {
    founder?: string | null;
    contributor?: string | null;
  }
): string | null {
  const primaryPublicRole = resolvePrimaryPublicRole(roles);
  if (primaryPublicRole === USER_ROLES.FOUNDER) {
    return labels?.founder || null;
  }
  if (primaryPublicRole === USER_ROLES.MEMBER || primaryPublicRole === USER_ROLES.GUEST) {
    return labels?.contributor || null;
  }
  return null;
}

/**
 * Publication limits for guest authors.
 */
export const GUEST_PUBLICATION_LIMITS = {
  YEARLY: 2,
  TOTAL: 4,
} as const;

/**
 * Resolves a localized display label for a canonical user role.
 */
export function resolveRoleLabel(
  role?: string | null,
  rolesDict?: {
    admin?: string;
    founder?: string;
    member?: string;
    guest?: string;
    reader?: string;
  }
): string {
  const normalized = role?.toLowerCase().trim();
  switch (normalized) {
    case USER_ROLES.ADMIN:
      return rolesDict?.admin || '';
    case USER_ROLES.FOUNDER:
      return rolesDict?.founder || '';
    case USER_ROLES.MEMBER:
      return rolesDict?.member || '';
    case USER_ROLES.GUEST:
      return rolesDict?.guest || '';
    case USER_ROLES.READER:
    default:
      return rolesDict?.reader || '';
  }
}
export const PUBLICATION_STATUSES = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  PUBLISHED: 'published',
} as const;

export type PublicationStatusValue = (typeof PUBLICATION_STATUSES)[keyof typeof PUBLICATION_STATUSES];

export interface EditablePublicationTarget {
  status: PublicationStatusValue | string;
  author_id?: string | null;
  author?: { id: string } | null;
}

/**
 * Evaluates whether a caller holding `permissions` can edit a publication
 * given its author and current status. Fails closed when permissions are empty.
 */
export function canEditPublication(
  permissions: readonly (PermissionValue | string)[] | null | undefined,
  publication: EditablePublicationTarget,
  userId?: string | null
): boolean {
  const authorId = publication.author?.id ?? publication.author_id ?? null;
  const isAuthor = Boolean(userId && authorId === userId);
  const isPublished = publication.status === PUBLICATION_STATUSES.PUBLISHED;
  const isInReview = publication.status === PUBLICATION_STATUSES.IN_REVIEW;
  const canUpdateAny = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_UPDATE_ANY);
  const canUpdateOwn = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_UPDATE_OWN);
  const canPublish = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_PUBLISH);
  const canReview = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_REVIEW);

  if (isAuthor) {
    return isPublished
      ? canPublish || canUpdateAny
      : canUpdateOwn || canUpdateAny || (isInReview && canReview);
  }

  return canUpdateAny || (isInReview && canReview);
}

export const EDITOR_ACTIONS = {
  DRAFT: 'draft',
  PUBLISH: 'publish',
  SUBMIT_APPROVAL: 'submit_approval',
  APPROVE: 'approve',
  REJECT: 'reject',
  REVOKE_APPROVAL: 'revoke_approval',
} as const;

export type EditorAction = (typeof EDITOR_ACTIONS)[keyof typeof EDITOR_ACTIONS];

/**
 * Editor actions that transition to or result in draft status and draft-related feedback.
 */
export const DRAFT_LIKE_ACTIONS: ReadonlySet<string> = new Set([
  EDITOR_ACTIONS.DRAFT,
  EDITOR_ACTIONS.REJECT,
  EDITOR_ACTIONS.REVOKE_APPROVAL,
]);

export function isDraftAction(action?: string | null): boolean {
  return action ? DRAFT_LIKE_ACTIONS.has(action) : false;
}

/**
 * Editor actions that trigger direct publication.
 */
export const PUBLISH_ACTIONS: ReadonlySet<string> = new Set([
  EDITOR_ACTIONS.PUBLISH,
  EDITOR_ACTIONS.APPROVE,
]);

export function isPublishAction(action?: string | null): boolean {
  return action ? PUBLISH_ACTIONS.has(action) : false;
}

export const PUBLICATION_TYPES = {
  ARTICLE: 'article',
  ESSAY: 'essay',
  REPORTAGE: 'reportage',
  COLUMN: 'column',
  INTERVIEW: 'interview',
  POETRY: 'poetry',
  NEWS: 'news',
} as const;

export type PublicationTypeValue = (typeof PUBLICATION_TYPES)[keyof typeof PUBLICATION_TYPES];

/**
 * Normalizes any recognized publication type string (Galician, Spanish, or English)
 * to a valid canonical PublicationTypeValue, falling back to ARTICLE.
 */
export function normalizePublicationType(type?: string | null): PublicationTypeValue {
  if (!type) return PUBLICATION_TYPES.ARTICLE;
  const val = type.toLowerCase().trim();
  switch (val) {
    case 'ensaio':
    case 'ensayo':
    case 'essay':
    case PUBLICATION_TYPES.ESSAY:
      return PUBLICATION_TYPES.ESSAY;
    case 'reportaxe':
    case 'reportaje':
    case 'reportage':
    case PUBLICATION_TYPES.REPORTAGE:
      return PUBLICATION_TYPES.REPORTAGE;
    case 'columna':
    case 'column':
    case 'narrativa':
    case PUBLICATION_TYPES.COLUMN:
      return PUBLICATION_TYPES.COLUMN;
    case 'entrevista':
    case 'interview':
    case PUBLICATION_TYPES.INTERVIEW:
      return PUBLICATION_TYPES.INTERVIEW;
    case 'poesia':
    case 'poesía':
    case 'poetry':
    case PUBLICATION_TYPES.POETRY:
      return PUBLICATION_TYPES.POETRY;
    case 'noticia':
    case 'news':
    case PUBLICATION_TYPES.NEWS:
      return PUBLICATION_TYPES.NEWS;
    case 'artigo':
    case 'articulo':
    case 'article':
    case PUBLICATION_TYPES.ARTICLE:
    default:
      return PUBLICATION_TYPES.ARTICLE;
  }
}

/**
 * Parses an optional publication type from a route or query param, returning undefined
 * if not recognized instead of defaulting to ARTICLE.
 */
export function parsePublicationType(raw?: string | null): PublicationTypeValue | undefined {
  if (!raw) return undefined;
  const val = raw.toLowerCase().trim();
  if (['ensaio', 'ensayo', 'essay', PUBLICATION_TYPES.ESSAY].includes(val as PublicationTypeValue)) return PUBLICATION_TYPES.ESSAY;
  if (['reportaxe', 'reportaje', 'reportage', PUBLICATION_TYPES.REPORTAGE].includes(val as PublicationTypeValue)) return PUBLICATION_TYPES.REPORTAGE;
  if (['columna', 'column', 'narrativa', PUBLICATION_TYPES.COLUMN].includes(val as PublicationTypeValue)) return PUBLICATION_TYPES.COLUMN;
  if (['entrevista', 'interview', PUBLICATION_TYPES.INTERVIEW].includes(val as PublicationTypeValue)) return PUBLICATION_TYPES.INTERVIEW;
  if (['poesia', 'poesía', 'poetry', PUBLICATION_TYPES.POETRY].includes(val as PublicationTypeValue)) return PUBLICATION_TYPES.POETRY;
  if (['noticia', 'news', PUBLICATION_TYPES.NEWS].includes(val as PublicationTypeValue)) return PUBLICATION_TYPES.NEWS;
  if (['artigo', 'articulo', 'article', PUBLICATION_TYPES.ARTICLE].includes(val as PublicationTypeValue)) return PUBLICATION_TYPES.ARTICLE;
  return undefined;
}
