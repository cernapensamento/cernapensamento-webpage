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
  ROLE: 'role',
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

export const USER_ROLES = {
  READER: 'reader',
  GUEST: 'guest',
  MEMBER: 'member',
  FOUNDER: 'founder',
  ADMIN: 'admin',
} as const;

export type UserRoleValue = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Privileged roles with direct publishing and editorial approval authority.
 * Includes legacy database and token aliases for backward compatibility.
 */
export const PRIVILEGED_ROLES: ReadonlySet<string> = new Set([
  USER_ROLES.ADMIN,
  USER_ROLES.FOUNDER,
  'admin',
  'founder',
  'fundador',
  'escritor',
]);

export function canPublishDirectly(role?: string | null): boolean {
  if (!role) return false;
  return PRIVILEGED_ROLES.has(role.toLowerCase().trim());
}

/**
 * Reader roles with no authoring or publishing permissions.
 * Includes legacy database aliases.
 */
export const READER_ROLES: ReadonlySet<string> = new Set([
  USER_ROLES.READER,
  'reader',
  'lector',
  'usuario',
]);

export function isReaderRole(role?: string | null): boolean {
  if (!role) return false;
  return READER_ROLES.has(role.toLowerCase().trim());
}

/**
 * Guest roles with limited publication quotas and mandatory editorial review.
 */
export const GUEST_ROLES: ReadonlySet<string> = new Set([
  USER_ROLES.GUEST,
  'guest',
  'invitado',
  'convidado',
]);

export function isGuestRole(role?: string | null): boolean {
  if (!role) return false;
  return GUEST_ROLES.has(role.toLowerCase().trim());
}

/**
 * Checks whether a user role has access to the writer desk (everything except reader roles).
 */
export function canAccessWriterDesk(role?: string | null): boolean {
  if (!role) return false;
  return !isReaderRole(role);
}

/**
 * Publication limits for guest authors.
 */
export const GUEST_PUBLICATION_LIMITS = {
  YEARLY: 2,
  TOTAL: 4,
} as const;

/**
 * Resolves a localized display label for a user role (including legacy role aliases).
 */
export function resolveRoleLabel(
  role?: string | null,
  rolesDict?: {
    admin?: string;
    founder?: string;
    writer?: string;
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
    case 'fundador':
    case 'escritor':
      return rolesDict?.founder || rolesDict?.writer || '';
    case USER_ROLES.MEMBER:
      return rolesDict?.member || '';
    case USER_ROLES.GUEST:
    case 'invitado':
    case 'convidado':
      return rolesDict?.guest || '';
    case USER_ROLES.READER:
    case 'lector':
    case 'usuario':
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
