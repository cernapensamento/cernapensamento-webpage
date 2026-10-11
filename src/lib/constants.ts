/**
 * Application Constants
 * Core media defaults, site identity, and re-exported database enum constants.
 */

export const DEFAULT_AVATAR_URL = 'https://imgs.search.brave.com/m12gFeEaYTH9TW9JHo1E4K4UFZBIAGpFdv-O_jdbty0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAzLzQ2LzgzLzk2/LzM2MF9GXzM0Njgz/OTY4M182bkFQemJo/cFNrSXBiOHBtQXd1/ZmtDN2M1ZUQ3d1l3/cy5qcGc';
export const DEFAULT_COVER_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBikfq6Lg8hza9PM5zO2xYJClve5fZp44rqWMjP8pDt5gvC6QS7CLzD6zgOPrqsiRcBvgxydSob4Ubt-dRBQYHIdWPysVHt8cdH-OjMW6kKEmcqqNQ5v4wfj0JskcNdhe63fnVYLOfYuPNRRfadpRg_5_pRotRPOngJ4fhszrJnWv3danu7gpZLaHD71fYL1LncxHMZUxz1C561USilETIbOiSgpLWPcCe4TtTvJiVwcv1tr4ghtTUMrr92p-5WJASeT2HqjT8LvRQ';
export const SITE_NAME = 'Cerna';

export const PUBLICATION_TYPES = [
  'article',
  'essay',
  'reportage',
  'column',
  'interview',
  'poetry',
  'news',
] as const;

export type PublicationType = (typeof PUBLICATION_TYPES)[number];
// Backwards compatibility alias
export const ARTICLE_TYPES = PUBLICATION_TYPES;
export type ArticleType = PublicationType;

export const PUBLICATION_STATUSES = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  PUBLISHED: 'published',
} as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[keyof typeof PUBLICATION_STATUSES];
// Backwards compatibility alias
export const ARTICLE_STATES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PENDING: 'in_review',
} as const;
export type ArticleState = PublicationStatus;

export const USER_ROLES = {
  READER: 'reader',
  GUEST: 'guest',
  MEMBER: 'member',
  FOUNDER: 'founder',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
