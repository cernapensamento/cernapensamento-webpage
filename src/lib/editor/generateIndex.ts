/**
 * generateIndex
 *
 * Scans HTML content for <h1>, <h2>, <h3> headings, normalizes slugs,
 * and generates hierarchical section numbers (1., 1.1., 1.1.1.).
 */

import type { IndexItem, Slug } from './ArticleIndexExtension';

/**
 * Converts heading text to a URL-safe slug.
 * - Lowercased
 * - Accents / diacritics stripped (NFD normalization)
 * - Non-alphanumeric characters replaced with hyphens
 * - Leading/trailing hyphens trimmed
 */
export function slugifyHeading(text: string): Slug {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')      // remove non-alphanumeric
    .trim()
    .replace(/[\s]+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')               // collapse multiple hyphens
    .replace(/^-+|-+$/g, '') as Slug;  // trim leading/trailing hyphens
}

export interface HeadingEntry {
  readonly level: 1 | 2 | 3;
  readonly text: string;
  readonly slug: Slug;
}

/**
 * Parses headings from an HTML string.
 * Strips math delimiters ($…$ and $$…$$) and HTML tags from heading text
 * before slugifying so anchor links work even in math-heavy articles.
 */
export function parseHeadings(html: string): HeadingEntry[] {
  const seen = new Map<string, number>();
  const entries: HeadingEntry[] = [];

  const regex = /<(h[123])[^>]*>([\s\S]*?)<\/h[123]>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const level = parseInt(tag[1], 10) as 1 | 2 | 3;
    const inner = match[2];

    // Strip HTML tags and math delimiters, then collapse whitespace
    const text = inner
      .replace(/<[^>]*>/g, '')          // strip tags
      .replace(/\$\$[\s\S]*?\$\$/g, '') // strip block math
      .replace(/\$[^$]*?\$/g, '')       // strip inline math
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) continue;

    const baseSlug = slugifyHeading(text);
    if (!baseSlug) continue;

    const count = seen.get(baseSlug) ?? 0;
    seen.set(baseSlug, count + 1);
    const slug = (count === 0 ? baseSlug : `${baseSlug}-${count + 1}`) as Slug;

    entries.push({ level, text, slug });
  }

  return entries;
}

/**
 * Converts parsed headings into hierarchical IndexItems with numbers (1., 1.1., 1.1.1.).
 * Intelligently shifts levels if the document only uses H2 and H3.
 */
export function buildHierarchicalHeadings(headings: HeadingEntry[]): IndexItem[] {
  const hasH1 = headings.some((h) => h.level === 1);
  const hasH2 = headings.some((h) => h.level === 2);

  let c1 = 0;
  let c2 = 0;
  let c3 = 0;

  return headings.map(({ level, text, slug }) => {
    let path: number[] = [];

    if (!hasH1 && hasH2) {
      // Document without H1: H2 acts as primary section (1., 2.), H3 acts as subsection (1.1., 1.2.)
      if (level === 2) {
        c1++;
        c2 = 0;
        path = [c1];
      } else if (level === 3) {
        if (c1 === 0) c1 = 1;
        c2++;
        path = [c1, c2];
      }
    } else {
      // Standard document: H1 (1.), H2 (1.1.), H3 (1.1.1.)
      if (level === 1) {
        c1++;
        c2 = 0;
        c3 = 0;
        path = [c1];
      } else if (level === 2) {
        if (c1 === 0) c1 = 1;
        c2++;
        c3 = 0;
        path = [c1, c2];
      } else if (level === 3) {
        if (c1 === 0) c1 = 1;
        if (c2 === 0) c2 = 1;
        c3++;
        path = [c1, c2, c3];
      }
    }

    // Fallback if path is somehow empty (e.g., deep heading without parents)
    if (path.length === 0) path = [1];

    return {
      path,
      text,
      slug,
    };
  });
}

/**
 * Extracts and calculates hierarchical headings directly from an HTML string.
 */
export function getHeadingsFromHtml(html: string): IndexItem[] {
  const headings = parseHeadings(html);
  return buildHierarchicalHeadings(headings);
}

/**
 * Strips any existing index block from an HTML string.
 * Supports any attributes on <nav data-type="article-index">.
 */
export function stripIndex(html: string): string {
  return html.replace(/<nav[^>]*data-type="article-index"[^>]*>[\s\S]*?<\/nav>/gi, '').trimStart();
}

/**
 * Generates the full index HTML block from an article's HTML content.
 */
export function generateIndex(html: string, lang: 'gl' | 'es'): string {
  const items = getHeadingsFromHtml(html);
  if (items.length === 0) return '';

  const label = lang === 'gl' ? 'Índice' : 'Índice';
  const ariaLabel = lang === 'es' ? 'Índice del artículo' : 'Índice do artigo';

  const rows = items
    .map((item) => {
      const level = item.path.length;
      const num = item.path.join('.') + '.';
      const indent = level === 1 ? '0' : level === 2 ? '1.5rem' : '3rem';
      const fontSize = level === 1 ? '1.15rem' : level === 2 ? '1.05rem' : '0.95rem';
      const fontWeight = level === 1 ? '600' : '400';
      const opacity = level === 3 ? '0.75' : level === 2 ? '0.9' : '1';
      const numWidth = level === 1 ? '1.75rem' : level === 2 ? '2.75rem' : '3.75rem';

      return `
        <div class="index-row index-level-${level}" role="listitem" style="display: flex; align-items: baseline; gap: 0.5rem; padding: 0.25rem 0 0.25rem ${indent}; margin: 0;">
          <span class="index-num" style="color: var(--color-gold); font-size: 0.95rem; font-weight: 600; letter-spacing: 0.02em; min-width: ${numWidth}; flex-shrink: 0; font-variant-numeric: tabular-nums; font-family: var(--font-sans);">${num}</span>
          <a href="#${item.slug}" class="index-link" style="color: var(--color-charcoal); opacity: ${opacity}; text-decoration: none; font-size: ${fontSize}; font-weight: ${fontWeight}; line-height: 1.5; font-family: var(--font-serif); transition: opacity 0.2s;">${item.text}</a>
        </div>
      `;
    })
    .join('');

  return `
    <nav data-type="article-index" aria-label="${ariaLabel}" class="article-index-block" lang="${lang}" data-items='${JSON.stringify(
      items
    ).replace(/'/g, "&apos;")}' style="border-top: 1px solid rgba(197, 160, 89, 0.4); border-bottom: 1px solid rgba(197, 160, 89, 0.4); padding: 1.5rem 0; margin-bottom: 2.5rem;">
      <div class="index-label" style="display: block; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-gold); margin-bottom: 1rem; font-family: var(--font-sans);">${label}</div>
      <div class="index-list" role="list" style="display: flex; flex-direction: column; gap: 0.25rem;">
        ${rows}
      </div>
    </nav>
  `.trim();
}
