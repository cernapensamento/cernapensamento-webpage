/**
 * Database Domain and Row Types
 * Fully-typed TypeScript interfaces matching the Cerna English database schema.
 */

import type { UserRoleValue, PublicationStatusValue, PublicationTypeValue } from './schema';

/**
 * Mandatory Bilingual Text
 * Both Galician ('gl') and Spanish ('es') are strictly required by editorial policy.
 * Can be extended with additional locales (e.g. 'en', 'pt') without schema changes.
 */
export type LocalizedString = {
  gl: string;
  es: string;
  [key: string]: string;
};

export type UserRole = UserRoleValue;
export type PublicationStatus = PublicationStatusValue;
export type PublicationType = PublicationTypeValue;

// ---------------------------------------------------------------------
// DATABASE ROW INTERFACES (Direct 1:1 Mapping to PostgreSQL Tables)
// ---------------------------------------------------------------------

export interface UserRow {
  id: string;
  full_name: string;
  slug: string | null;
  bio: LocalizedString | null;
  avatar_url: string | null;
  newsletter_subscribed: boolean;
  role: UserRole;
}

export interface PublicationRow {
  id: string;
  slug: string;
  cover_image_url: string | null;
  status: PublicationStatus;
  type: PublicationType;
  original_language: 'gl' | 'es';
  is_pinned: boolean;
  author_id: string;
  title: LocalizedString;
  subtitle: LocalizedString | null;
  content: LocalizedString;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: string;
  publication_id: string;
  author_id: string;
  content: string;
  updated_at: string;
}

export interface TagRow {
  id: string;
  slug: string;
  created_at: string;
}

export interface TagTranslationRow {
  tag_id: string;
  lang: string;
  name: string;
}

export interface PublicationTagRow {
  publication_id: string;
  tag_id: string;
}

// ---------------------------------------------------------------------
// COMPOSITE & VIEW TYPES (Domain Aggregates for UI & Performance)
// ---------------------------------------------------------------------

/**
 * Tag with Localized Display Name
 */
export interface TagItem {
  id?: string;
  slug: string;
  name: string;
}

/**
 * Lightweight Author Summary for Cards & List Views
 */
export interface AuthorSummary {
  id: string;
  full_name: string;
  slug: string | null;
  avatar_url: string | null;
  bio?: LocalizedString | null;
}

/**
 * Optimized Publication Card Item
 * Strict bandwidth guardrail: NEVER includes heavy content fields.
 */
export interface PublicationCardItem {
  id: string;
  slug: string;
  title: LocalizedString;
  subtitle: LocalizedString | null;
  cover_image_url: string | null;
  type: PublicationType;
  status: PublicationStatus;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author: AuthorSummary;
  tags: TagItem[];
}

/**
 * Full Publication Detail for Reader (/articulo/[slug])
 */
export interface PublicationDetail {
  id: string;
  slug: string;
  title: LocalizedString;
  subtitle: LocalizedString | null;
  content: LocalizedString;
  cover_image_url: string | null;
  type: PublicationType;
  status: PublicationStatus;
  original_language: 'gl' | 'es';
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author: AuthorSummary;
  tags: TagItem[];
}

/**
 * Comment with Author Profile
 */
export interface CommentItem {
  id: string;
  publication_id: string;
  author_id: string;
  content: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    slug: string | null;
  };
}

/**
 * Columnist (Founder) Profile for Homepage Grid/Carousel
 */
export interface ColumnistItem {
  id: string;
  full_name: string;
  slug: string | null;
  bio: LocalizedString | null;
  avatar_url: string | null;
  role: UserRole;
}

/**
 * Author Public Page (/autor/[slug])
 */
export interface AuthorProfileDetail {
  id: string;
  full_name: string;
  slug: string | null;
  bio: LocalizedString | null;
  avatar_url: string | null;
  role: UserRole;
  publications: PublicationCardItem[];
}
