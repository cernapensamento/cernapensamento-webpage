/**
 * Database Domain and Row Types
 * Fully-typed TypeScript interfaces matching the Cerna English database schema.
 */

import type {
  UserRoleValue,
  PublicRoleValue,
  PermissionValue,
  PublicationStatusValue,
  PublicationTypeValue,
} from './schema';

/**
 * Localized Multilingual Text
 * Supports default locales ('gl', 'es') and dynamically extends to any additional locale.
 */
export type LocalizedString = {
  gl?: string;
  es?: string;
  [key: string]: string | undefined;
};

export type UserRole = UserRoleValue;
export type { PublicRoleValue, PermissionValue };
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
  roles?: UserRole[];
  publicRole?: PublicRoleValue | null;
}

/**
 * Public user columns safe for anonymous (anon) reads.
 * Excludes private fields such as newsletter_subscribed.
 */
export type PublicUserRow = Omit<UserRow, 'newsletter_subscribed'>;

export type AuthProfile = {
  roles: UserRole[];
  permissions: PermissionValue[];
  role?: UserRole;
  rol?: UserRole;
  avatar_url: string | null;
  full_name?: string | null;
};

export type ProfileRow = UserRow & {
  rol: UserRole;
  roles?: UserRole[];
  permissions?: PermissionValue[];
};

export interface PublicationRow {
  id: string;
  slug: string;
  cover_image_url: string | null;
  status: PublicationStatus;
  type: PublicationType;
  original_language: string;
  is_pinned: boolean;
  show_index: boolean;
  author_id: string;
  title: LocalizedString;
  subtitle: LocalizedString | null;
  content: LocalizedString;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  newsletter_sent_at?: string | null;
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
  original_language?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
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
  original_language: string;
  is_pinned: boolean;
  show_index: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
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
  roles?: UserRole[];
  role?: UserRole;
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
  roles?: UserRole[];
  publicRole?: PublicRoleValue | null;
  role?: UserRole;
  publications: PublicationCardItem[];
}

/**
 * Author with at least one published publication (/autores).
 * Aggregated from publication metadata only; never includes heavy content.
 */
export interface PublishedAuthorItem {
  id: string;
  full_name: string;
  slug: string | null;
  bio: LocalizedString | null;
  avatar_url: string | null;
  roles?: UserRole[];
  publicRole?: PublicRoleValue | null;
  role?: UserRole;
  published_count: number;
  latest_publication_at: string | null;
  latest_publication_title: LocalizedString | null;
  latest_publication_slug: string | null;
  latest_publication_original_language?: string | null;
  publication_types: PublicationType[];
}

/**
 * Lightweight publication item for the writer desk dashboard.
 * Never includes heavy content fields.
 */
export interface PublicationDashboardItem {
  id: string;
  slug: string;
  title: LocalizedString;
  subtitle: LocalizedString | null;
  cover_image_url: string | null;
  type: PublicationType;
  status: PublicationStatus;
  original_language?: string;
  is_pinned: boolean | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  author_id: string;
  author: {
    id: string;
    full_name: string;
  } | null;
}

/**
 * Computed publication quota status for guest authors.
 */
export interface GuestPublicationQuota {
  totalCount: number;
  yearlyCount: number;
  totalLimit: number;
  yearlyLimit: number;
  canCreate: boolean;
}
