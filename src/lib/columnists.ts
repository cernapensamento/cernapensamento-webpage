export interface Columnist {
  id: string;
  slug: string;
  name: string;
  email: string;
  instagram: string;
  image: string;
  role?: 'escritor' | 'admin' | 'invitado' | 'fundador';
}

export const COLUMNISTS: Columnist[] = [
  {
    id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
    slug: 'diego-araujo',
    name: 'Diego Araújo',
    email: 'diegoaraujo@cernapensamento.org',
    instagram: '@diegoaraujorodriguez_',
    image: '/images/columnistas/diego.jpeg',
    role: 'escritor',
  },
  {
    id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
    slug: 'hector-gonzalez',
    name: 'Héctor González',
    email: 'hectorgonzalez@cernapensamento.org',
    instagram: '@hector.gonzalezzz_',
    image: '/images/columnistas/hector.jpeg',
    role: 'escritor',
  },
  {
    id: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
    slug: 'denis-fernandez',
    name: 'Denís Fernández',
    email: 'denisfernandez@cernapensamento.org',
    instagram: '@denisfdeez',
    image: '/images/columnistas/denis.jpeg',
    role: 'escritor',
  },
  {
    id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    slug: 'anxo-perez',
    name: 'Anxo Pérez',
    email: 'anxoperez@cernapensamento.org',
    instagram: '@anxoperezprego',
    image: '/images/columnistas/anxo.jpeg',
    role: 'escritor',
  }
];

export function getColumnistBySlug(slug?: string | null): Columnist | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  return COLUMNISTS.find(c => c.slug === normalized || c.id === normalized);
}
