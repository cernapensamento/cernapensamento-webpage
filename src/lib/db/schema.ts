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

export const PUBLICATION_COLS = {
  ID: 'id',
  SLUG: 'slug',
  COVER_IMAGE_URL: 'cover_image_url',
  STATUS: 'status',
  TYPE: 'type',
  ORIGINAL_LANGUAGE: 'original_language',
  IS_PINNED: 'is_pinned',
  AUTHOR_ID: 'author_id',
  TITLE: 'title',
  SUBTITLE: 'subtitle',
  CONTENT: 'content',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
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

export const PUBLICATION_STATUSES = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  PUBLISHED: 'published',
} as const;

export type PublicationStatusValue = (typeof PUBLICATION_STATUSES)[keyof typeof PUBLICATION_STATUSES];

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
