import { USER_ROLES } from '@/lib/db/schema';
import type { UserRole } from '@/lib/db/types';

export interface Columnist {
  slug: string;
  name: string;
  email: string;
  instagram: string;
  image: string;
  roles: readonly UserRole[];
  role?: UserRole;
}

export const COLUMNISTS: readonly Columnist[] = [
  {
    slug: 'diego-araujo',
    name: 'Diego Araújo',
    email: 'diegoaraujo@cernapensamento.org',
    instagram: '@diegoaraujorodriguez_',
    image: '/images/columnistas/diego.webp',
    roles: [USER_ROLES.FOUNDER],
    role: USER_ROLES.FOUNDER,
  },
  {
    slug: 'hector-gonzalez',
    name: 'Héctor González',
    email: 'hectorgonzalez@cernapensamento.org',
    instagram: '@hector.gonzalezzz_',
    image: '/images/columnistas/hector.webp',
    roles: [USER_ROLES.FOUNDER],
    role: USER_ROLES.FOUNDER,
  },
  {
    slug: 'denis-fernandez',
    name: 'Denís Fernández',
    email: 'denisfernandez@cernapensamento.org',
    instagram: '@denisfdeez',
    image: '/images/columnistas/denis.webp',
    roles: [USER_ROLES.FOUNDER],
    role: USER_ROLES.FOUNDER,
  },
  {
    slug: 'anxo-perez',
    name: 'Anxo Pérez',
    email: 'anxoperez@cernapensamento.org',
    instagram: '@anxoperezprego',
    image: '/images/columnistas/anxo.webp',
    roles: [USER_ROLES.FOUNDER],
    role: USER_ROLES.FOUNDER,
  },
];

export function getColumnistBySlug(slug?: string | null): Columnist | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  return COLUMNISTS.find((c) => c.slug === normalized);
}

export function getAllColumnists(): readonly Columnist[] {
  return COLUMNISTS;
}
