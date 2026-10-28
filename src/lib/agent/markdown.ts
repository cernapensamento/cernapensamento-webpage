import Negotiator from 'negotiator';

const SITE_URL = 'https://cernapensamento.org';

/**
 * Checks if the client explicitly prefers text/markdown over text/html
 * using standard HTTP content negotiation (acceptmarkdown.com specification).
 */
export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
  if (!acceptHeader || !acceptHeader.toLowerCase().includes('text/markdown')) {
    return false;
  }

  try {
    const negotiator = new Negotiator({
      headers: { accept: acceptHeader },
    });
    const mediaTypes = negotiator.mediaTypes(['text/markdown', 'text/html']);
    return mediaTypes[0] === 'text/markdown';
  } catch {
    return acceptHeader.toLowerCase().startsWith('text/markdown');
  }
}

/**
 * Generates an agent-friendly Markdown error body for HTTP 404 responses.
 * Strictly satisfies the requirement of >= 20 characters and links to sitemap and llms.txt.
 */
export function get404Markdown(locale: string = 'gl'): string {
  const isGalician = locale === 'gl';

  if (isGalician) {
    return `# 404 - Páxina non atopada (Not Found)

O recurso solicitado non existe ou foi movido en Cerna Pensamento.

Podes consultar os seguintes recursos para navegar pola publicación e atopar o contido:
- [Portada de Cerna Pensamento](${SITE_URL}/gl)
- [Arquivo xeral de publicacións](${SITE_URL}/gl/articulos)
- [Directorio de autores](${SITE_URL}/gl/autores)
- [Caderno de novas e convocatorias](${SITE_URL}/gl/noticias)
- [Mapa do sitio (Sitemap XML)](${SITE_URL}/sitemap.xml)
- [Instrucións para axentes de IA (llms.txt)](${SITE_URL}/llms.txt)

Para consultas editoriais ou asistencia técnica: contacto@cernapensamento.org
`;
  }

  return `# 404 - Página no encontrada (Not Found)

El recurso solicitado no existe o ha sido movido en Cerna Pensamento.

Puedes consultar los siguientes recursos para navegar por la publicación y localizar el contenido:
- [Portada de Cerna Pensamento](${SITE_URL}/es)
- [Archivo general de publicaciones](${SITE_URL}/es/articulos)
- [Directorio de autores](${SITE_URL}/es/autores)
- [Cuaderno de noticias y convocatorias](${SITE_URL}/es/noticias)
- [Mapa del sitio (Sitemap XML)](${SITE_URL}/sitemap.xml)
- [Instrucciones para agentes de IA (llms.txt)](${SITE_URL}/llms.txt)

Para consultas editoriales o soporte técnico: contacto@cernapensamento.org
`;
}

/**
 * Generates a clean, structured Markdown representation of the Cerna Pensamento homepage
 * for AI agents requesting Accept: text/markdown.
 */
export function getHomepageMarkdown(locale: string = 'gl'): string {
  const isGalician = locale === 'gl';
  const langPrefix = isGalician ? 'gl' : 'es';

  if (isGalician) {
    return `# Cerna Pensamento · Revista Galega de Ensaio, Filosofía e Creación Literaria

> Revista dixital e asociación cultural independente en Galicia dedicada ao ensaio, a filosofía política, a economía (incluíndo a tradición da Escola Austríaca de economía), o debate intelectual e a creación literaria en lingua galega e castelá.

- **Sitio web:** ${SITE_URL}/${langPrefix}
- **Idioma principal:** Galego (\`gl\`), con versión bilingüe en castelán (\`es\`)
- **Sede editorial:** Santiago de Compostela, Galicia, España
- **Contacto editorial:** contacto@cernapensamento.org

---

## Estrutura da Publicación e Seccións Principais

- [Arquivo Xeral de Publicacións](${SITE_URL}/${langPrefix}/articulos): Catálogo completo con filtros temáticos por ensaio, artigo de opinión, narrativa e poesía.
- [Artigos de Opinión](${SITE_URL}/${langPrefix}/articulos?tipo=article): Columnas semanais, análise de actualidade e crítica política.
- [Ensaios Filosóficos e Económicos](${SITE_URL}/${langPrefix}/articulos?tipo=essay): Monográficos extensos sobre teoría do valor, dereito, economía e sociedade aberta.
- [Caderno de Novas](${SITE_URL}/${langPrefix}/noticias): Axenda cultural, convocatorias de ensaio e avisos editoriais.
- [A Asociación Cerna](${SITE_URL}/${langPrefix}/asociacion): Manifesto fundacional, obxectivos e ideario da asociación civil independente.
- [Estatutos Oficiais](${SITE_URL}/${langPrefix}/asociacion/estatutos): Marco legal, réxime interno e gobernanza da asociación.
- [Directorio de Autores e Columnistas](${SITE_URL}/${langPrefix}/autores): Perfís dos autores, investigadores e membros do consello editorial.
- [Contacto e Envío de Propostas](${SITE_URL}/${langPrefix}/contacto): Canle oficial para propostas de colaboración e cartas ao consello.
- [Política de Privacidade](${SITE_URL}/${langPrefix}/privacidad): Tratamento de datos persoais, dereitos e información legal.

---

## Guía e Recursos para Axentes de Intelixencia Artificial

- [Instrucións para Axentes de IA (llms.txt)](${SITE_URL}/llms.txt): Guía de integración con casos de uso recomendados e protocolo de consulta.
- [Mapa do Sitio (Sitemap XML)](${SITE_URL}/sitemap.xml): Listaxe canónica de todas as URLs indexables con datas de última modificación.
- **Negociación de contido (acceptmarkdown.com):** Podes enviar o encabezado HTTP \`Accept: text/markdown\` nas portadas, nos artigos e nas páxinas legais de privacidade e estatutos, en galego ou castelán, para recibir Markdown. Outras rutas válidas poden devolver HTML.
`;
  }

  return `# Cerna Pensamento · Revista Cultural de Ensayo, Filosofía y Creación Literaria

> Revista digital y asociación cultural independiente en Galicia dedicada al ensayo, la filosofía política, la economía (incluida la tradición de la Escuela Austríaca de economía), el debate intelectual y la creación literaria en gallego y castellano.

- **Sitio web:** ${SITE_URL}/${langPrefix}
- **Idioma principal:** Gallego (\`gl\`), con versión bilingüe en castellano (\`es\`)
- **Sede editorial:** Santiago de Compostela, Galicia, España
- **Contacto editorial:** contacto@cernapensamento.org

---

## Estructura de la Publicación y Secciones Principales

- [Archivo General de Publicaciones](${SITE_URL}/${langPrefix}/articulos): Catálogo completo con filtros temáticos por ensayo, artículo de opinión, narrativa y poesía.
- [Artículos de Opinión](${SITE_URL}/${langPrefix}/articulos?tipo=article): Columnas semanales, análisis de actualidad y crítica política.
- [Ensayos Filosóficos y Económicos](${SITE_URL}/${langPrefix}/articulos?tipo=essay): Monográficos extensos sobre teoría del valor, derecho, economía y sociedad abierta.
- [Cuaderno de Noticias](${SITE_URL}/${langPrefix}/noticias): Agenda cultural, convocatorias de ensayo y avisos editoriales.
- [La Asociación Cerna](${SITE_URL}/${langPrefix}/asociacion): Manifiesto fundacional, objetivos e ideario de la asociación civil independiente.
- [Estatutos Oficiales](${SITE_URL}/${langPrefix}/asociacion/estatutos): Marco legal, régimen interno y gobernanza de la asociación.
- [Directorio de Autores y Columnistas](${SITE_URL}/${langPrefix}/autores): Perfiles de los autores, investigadores y miembros del consejo editorial.
- [Contacto y Envío de Propuestas](${SITE_URL}/${langPrefix}/contacto): Canal oficial para propuestas de colaboración y cartas al consejo.
- [Política de Privacidad](${SITE_URL}/${langPrefix}/privacidad): Tratamiento de datos personales, derechos e información legal.

---

## Guía y Recursos para Agentes de Inteligencia Artificial

- [Instrucciones para Agentes de IA (llms.txt)](${SITE_URL}/llms.txt): Guía de integración con casos de uso recomendados y protocolo de consulta.
- [Mapa del Sitio (Sitemap XML)](${SITE_URL}/sitemap.xml): Listado canónico de todas las URLs indexables con fechas de última modificación.
- **Negociación de contenido (acceptmarkdown.com):** Puedes enviar la cabecera HTTP \`Accept: text/markdown\` en las portadas, los artículos y las páginas legales de privacidad y estatutos, en gallego o castellano, para recibir Markdown. Otras rutas válidas pueden devolver HTML.
`;
}

/**
 * Checks whether a given request pathname is the homepage.
 */
export function isHomepagePath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/gl' ||
    pathname === '/gl/' ||
    pathname === '/es' ||
    pathname === '/es/'
  );
}

/**
 * Checks if a given pathname corresponds to a known valid route or resource in Cerna.
 * Returns false for unknown paths, probe URLs, and 404 targets.
 */
export function isKnownPath(pathname: string): boolean {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // Static files and system paths
  if (
    cleanPath === '/sitemap.xml' ||
    cleanPath === '/robots.txt' ||
    cleanPath === '/llms.txt' ||
    cleanPath === '/favicon.ico' ||
    cleanPath.startsWith('/images/') ||
    cleanPath.startsWith('/_next/') ||
    cleanPath.startsWith('/api/') ||
    cleanPath.startsWith('/auth/')
  ) {
    return true;
  }

  // Homepages
  if (isHomepagePath(cleanPath)) {
    return true;
  }

  // Strip locale prefix if present (e.g., /gl/articulos -> /articulos)
  let pathWithoutLocale = cleanPath;
  const localeMatch = cleanPath.match(/^\/(gl|es)(\/.*)?$/);
  if (localeMatch) {
    pathWithoutLocale = localeMatch[2] || '/';
  }

  if (isHomepagePath(pathWithoutLocale)) {
    return true;
  }

  const knownExactSegments = new Set([
    '/articulos',
    '/autores',
    '/asociacion',
    '/asociacion/estatutos',
    '/asociacion/coleccion-articulos',
    '/asociacion/coleccion-ensayos',
    '/asociacion/coleccion-narrativa',
    '/asociacion/coleccion-poesia',
    '/noticias',
    '/contacto',
    '/privacidad',
    '/privacy',
    '/about',
    '/contact',
    '/login',
    '/escritorio',
    '/escritorio/nuevo',
    '/escritorio/perfil',
    '/recuperar-password',
    '/actualizar-password',
    '/bad-request',
  ]);

  if (knownExactSegments.has(pathWithoutLocale)) {
    return true;
  }

  // Dynamic routes: /articulo/[slug], /autor/[slug], /escritorio/editar/[slug]
  if (
    /^\/articulo\/[^/]+$/.test(pathWithoutLocale) ||
    /^\/autor\/[^/]+$/.test(pathWithoutLocale) ||
    /^\/escritorio\/editar\/[^/]+$/.test(pathWithoutLocale)
  ) {
    return true;
  }

  return false;
}
