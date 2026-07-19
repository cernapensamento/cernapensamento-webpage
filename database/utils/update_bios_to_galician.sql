-- Actualizar biografías y avatares de los escritores a sus versiones oficiales en gallego
-- Extraídas directamente del componente ColumnistsSection.tsx
-- Ejecutar en el editor SQL de Supabase

UPDATE public.perfiles SET
  bio = 'Estudante de Economía na USC, Premio Extraordinario de Bacharelato 2025 e gañador do Parlamento Xove 2026 (categoría universidade) xunto a Héctor González Prego, recoñecido ademais como Mellor Orador da edición. As súas columnas nacen dunha inquietude por entender o mundo dende a filosofía política, a economía, as ciencias políticas e o dereito, cun interese especial no estudo da liberdade, ademais de artigos máis técnicos centrados na análise político-filosófica, a economía austríaca e os fundamentos macro e microeconómicos.',
  avatar_url = '/images/columnistas/diego.jpeg'
WHERE slug = 'diego-araujo' OR id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1';

UPDATE public.perfiles SET
  bio = 'Estudante de Física na Universidade de Santiago de Compostela e de Matemáticas na UNED, gañador do Parlamento Xove 2026 na categoría universitaria xunto a Diego Araújo Rodríguez. Os seus artigos nacen da curiosidade científica e do interese por comprender o mundo a través de modelos científicos, especialmente matemáticos, así como por transmitir estas ideas dun xeito claro, rigoroso e accesible. Busca achegar conceptos útiles e aplicables, sen renunciar á reflexión, con interese tamén por ámbitos como a psicoloxía e a comunicación.',
  avatar_url = '/images/columnistas/hector.jpeg'
WHERE slug = 'hector-gonzalez' OR id = 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2';

UPDATE public.perfiles SET
  bio = 'Estuda o dobre grao bilingüe en Dereito e Administración e Dirección de Empresas (ADE) na Universidade Carlos III de Madrid. No ámbito do debate, foi distinguido na categoría de Bacharelato como mellor orador na fase previa do Parlamento Xove na edición de 2025. Os seus artigos nacen do interese por analizar a realidade socioeconómica e xurídica actual, cunha mirada especialmente centrada nos retos, perspectivas e problemáticas que afronta a mocidade de hoxe en día.',
  avatar_url = '/images/columnistas/denis.jpeg'
WHERE slug = 'denis-fernandez' OR id = 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3';

UPDATE public.perfiles SET
  bio = 'Estudante de Lingua e Literatura Españolas na Universidade de Navarra. A súa obra foi recoñecida en certames literarios galegos, como o Premio de Poesía «Cambados Mar de Letras» e o «Certame Literario de Ames», e en 2025 foi distinguido como mellor orador da categoría de Bacharelato na fase final de Parlamento Xove. A súa escrita céntrase no problema da identidade, con especial atención á tradición como forma de resistencia. Aborda o proceso de secularización de Europa e dialoga coa tradición galeguista e co pensamento europeo.',
  avatar_url = '/images/columnistas/anxo.jpeg'
WHERE slug = 'anxo-perez' OR id = 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4';
