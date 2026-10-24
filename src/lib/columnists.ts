export interface ColumnistBio {
  gl: string;
  es: string;
}

export interface Columnist {
  id: string;
  slug: string;
  name: string;
  email: string;
  instagram: string;
  image: string;
  role?: 'escritor' | 'admin' | 'invitado' | 'fundador';
  bio: ColumnistBio;
}

export const COLUMNISTS: Columnist[] = [
  {
    id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
    slug: 'diego-araujo',
    name: 'Diego Araújo',
    email: 'diegoaraujo@cernapensamento.org',
    instagram: '@diegoaraujorodriguez_',
    image: '/images/columnistas/diego.webp',
    role: 'fundador',
    bio: {
      gl: 'Estudante de Economía na USC, Premio Extraordinario de Bacharelato 2025 e gañador do Parlamento Xove 2026 (categoría universidade) xunto a Héctor González Prego, recoñecido ademais como Mellor Orador da edición. As súas columnas nacen dunha inquietude por entender o mundo dende a filosofía política, a economía, as ciencias políticas e o dereito, cun interese especial no estudo da liberdade, ademais de artigos máis técnicos centrados na análise político-filosófica, a economía austríaca e os fundamentos macro e microeconómicos.',
      es: 'Estudiante de Economía en la USC, Premio Extraordinario de Bachillerato 2025 y ganador del Parlamento Xove 2026 (categoría universidad) junto a Héctor González Prego, reconocido además como Mejor Orador de la edición. Sus columnas nacen de una inquietud por entender el mundo desde la filosofía política, la economía, las ciencias políticas y el derecho, con un interés especial en el estudio de la libertad, además de artículos más técnicos centrados en el análisis político-filosófico, la economía austríaca y los fundamentos macro y microeconómicos.'
    }
  },
  {
    id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
    slug: 'hector-gonzalez',
    name: 'Héctor González',
    email: 'hectorgonzalez@cernapensamento.org',
    instagram: '@hector.gonzalezzz_',
    image: '/images/columnistas/hector.webp',
    role: 'fundador',
    bio: {
      gl: 'Estudante de Física na Universidade de Santiago de Compostela e de Matemáticas na UNED, gañador do Parlamento Xove 2026 na categoría universitaria xunto a Diego Araújo Rodríguez. Os seus artigos nacen da curiosidade científica e do interese por comprender o mundo a través de modelos científicos, especialmente matemáticos, así como por transmitir estas ideas dun xeito claro, rigoroso e accesible. Busca achegar conceptos útiles e aplicables, sen renunciar á reflexión, con interese tamén por ámbitos como a psicoloxía e a comunicación.',
      es: 'Estudiante de Física en la Universidad de Santiago de Compostela y de Matemáticas en la UNED, ganador del Parlamento Xove 2026 en la categoría universitaria junto a Diego Araújo Rodríguez. Sus artículos nacen de la curiosidad científica y del interés por comprender el mundo a través de modelos científicos, especialmente matemáticos, así como por transmitir estas ideas de un modo claro, riguroso y accesible. Busca acercar conceptos útiles y aplicables, sin renunciar a la reflexión, con interés también por ámbitos como la psicología y la comunicación.'
    }
  },
  {
    id: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
    slug: 'denis-fernandez',
    name: 'Denís Fernández',
    email: 'denisfernandez@cernapensamento.org',
    instagram: '@denisfdeez',
    image: '/images/columnistas/denis.webp',
    role: 'fundador',
    bio: {
      gl: 'Estuda o dobre grao bilingüe en Dereito e Administración e Dirección de Empresas (ADE) na Universidade Carlos III de Madrid. No ámbito do debate, foi distinguido na categoría de Bacharelato como mellor orador na fase previa do Parlamento Xove na edición de 2025. Os seus artigos nacen do interese por analizar a realidade socioeconómica e xurídica actual, cunha mirada especialmente centrada nos retos, perspectivas e problemáticas que afronta a mocidade de hoxe en día.',
      es: 'Estudia el doble grado bilingüe en Derecho y Administración y Dirección de Empresas (ADE) en la Universidad Carlos III de Madrid. En el ámbito del debate, fue distinguido en la categoría de Bachillerato como mejor orador en la fase previa del Parlamento Xove en la edición de 2025. Sus artículos nacen del interés por analizar la realidad socioeconómica y jurídica actual, con una mirada especialmente centrada en los retos, perspectivas y problemáticas que afronta la juventud de hoy en día.'
    }
  },
  {
    id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    slug: 'anxo-perez',
    name: 'Anxo Pérez',
    email: 'anxoperez@cernapensamento.org',
    instagram: '@anxoperezprego',
    image: '/images/columnistas/anxo.webp',
    role: 'fundador',
    bio: {
      gl: 'Estudante de Lingua e Literatura Españolas na Universidade de Navarra. A súa obra foi recoñecida en certames literarios galegos, como o Premio de Poesía «Cambados Mar de Letras» e o «Certame Literario de Ames», e en 2025 foi distinguido como mellor orador da categoría de Bacharelato na fase final de Parlamento Xove. A súa escrita céntrase no problema da identidade, con especial atención á tradición como forma de resistencia. Aborda o proceso de secularización de Europa e dialoga coa tradición galeguista e co pensamento europeo.',
      es: 'Estudiante de Lengua y Literatura Españolas en la Universidad de Navarra. Su obra ha sido reconocida en certámenes literarios gallegos, como el Premio de Poesía «Cambados Mar de Letras» y el «Certamen Literario de Ames», y en 2025 fue distinguido como mejor orador de la categoría de Bachillerato en la fase final de Parlamento Xove. Su escritura se centra en el problema de la identidad, con especial atención a la tradición como forma de resistencia. Aborda el proceso de secularización de Europa y dialoga con la tradición galleguista y con el pensamiento europeo.'
    }
  }
];

export function getColumnistBySlug(slug?: string | null): Columnist | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  return COLUMNISTS.find(c => c.slug === normalized || c.id === normalized);
}

export function getAllColumnists(): Columnist[] {
  return COLUMNISTS;
}
