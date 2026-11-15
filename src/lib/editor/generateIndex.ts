/**
 * generateIndex
 *
 * Scans HTML content for <h1>, <h2>, <h3> headings, normalizes slugs,
 * and generates hierarchical section numbers (1., 1.1., 1.1.1.).
 */

export type Slug = string & { readonly __brand: unique symbol };

export interface IndexItem {
  readonly path: readonly number[];
  readonly text: string;
  readonly slug: Slug;
}

export interface IndexLevelStyle {
  readonly indent: string;
  readonly fontSize: string;
  readonly fontWeight: string;
  readonly opacity: string;
  readonly numWidth: string;
}

const INDEX_LEVEL_STYLES: Record<1 | 2 | 3, IndexLevelStyle> = {
  1: { indent: '0', fontSize: '1.15rem', fontWeight: '600', opacity: '1', numWidth: '1.75rem' },
  2: { indent: '1.5rem', fontSize: '1.05rem', fontWeight: '400', opacity: '0.9', numWidth: '2.75rem' },
  3: { indent: '3rem', fontSize: '0.95rem', fontWeight: '400', opacity: '0.75', numWidth: '3.75rem' },
};

export const INDEX_BLOCK_STYLES = {
  nav: 'border-top: 1px solid rgba(197, 160, 89, 0.4); border-bottom: 1px solid rgba(197, 160, 89, 0.4); padding: 1.75rem 2rem; margin-bottom: 2.5rem;',
  label: 'display: block; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-gold); margin-bottom: 1rem; font-family: var(--font-sans);',
  list: 'display: flex; flex-direction: column; gap: 0.25rem;',
} as const;

const INDEX_ARIA_LABELS: Record<string, string> = {
  es: 'Índice del artículo',
  gl: 'Índice do artigo',
  pt: 'Índice do artigo',
  en: 'Article index',
};

/**
 * Returns the visual style tokens for a given heading depth (clamped to levels 1–3).
 */
export function getIndexLevelStyle(level: number): IndexLevelStyle {
  const clamped = Math.min(Math.max(level, 1), 3) as 1 | 2 | 3;
  return INDEX_LEVEL_STYLES[clamped];
}

/**
 * Returns the localized visible label and accessible aria-label for an article index block.
 */
export function getIndexLabels(lang: string): { label: string; ariaLabel: string } {
  return {
    label: 'Índice',
    ariaLabel: INDEX_ARIA_LABELS[lang] || 'Índice',
  };
}

/**
 * Builds the inline CSS strings for a single index row, shared by both
 * TipTap's DOMOutputSpec renderer and the static HTML fallback generator.
 */
export function getIndexRowStyles(level: number): { row: string; num: string; link: string } {
  const { indent, fontSize, fontWeight, opacity, numWidth } = getIndexLevelStyle(level);
  return {
    row: `display: flex; align-items: baseline; gap: 0.5rem; padding: 0.25rem 0 0.25rem ${indent}; margin: 0;`,
    num: `color: var(--color-gold); font-size: 0.95rem; font-weight: 600; letter-spacing: 0.02em; min-width: ${numWidth}; flex-shrink: 0; font-variant-numeric: tabular-nums; font-family: var(--font-sans);`,
    link: `color: var(--color-charcoal, inherit); opacity: ${opacity}; text-decoration: none; font-size: ${fontSize}; font-weight: ${fontWeight}; line-height: 1.5; font-family: var(--font-serif); transition: opacity 0.2s;`,
  };
}

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

/**
 * Strips leading section numbering from user-authored heading text
 * (e.g. "1. Title", "2.2. Subtitle", "1.2.3. Section", "1.- Intro")
 * to avoid duplicate numbering when the index generates its own hierarchy.
 */
export function stripHeadingNumbering(text: string): string {
  // 1. Hierarchical numbers like 1.1, 1.2.3, 2.2., with optional trailing dot/paren/dash
  const hierarchical = /^(\d+(?:\.\d+)+(?:[\.\)\-]|(?:\.-))?)\s*/;
  if (hierarchical.test(text)) {
    return text.replace(hierarchical, '').trim();
  }
  // 2. Single numbers up to 2 digits followed by dot, paren, or dash: '1. ', '1) ', '1.- ', '1.Title'
  const single = /^(\d{1,2}(?:\.-|[\.\)\-])\s*)/;
  if (single.test(text)) {
    return text.replace(single, '').trim();
  }
  return text;
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
    const rawText = inner
      .replace(/<[^>]*>/g, '')          // strip tags
      .replace(/\$\$[\s\S]*?\$\$/g, '') // strip block math
      .replace(/\$[^$]*?\$/g, '')       // strip inline math
      .replace(/\s+/g, ' ')
      .trim();

    if (!rawText) continue;

    const text = stripHeadingNumbering(rawText) || rawText;

    const baseSlug = slugifyHeading(rawText) || slugifyHeading(text);
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
  const shiftLevel = !headings.some((h) => h.level === 1) && headings.some((h) => h.level === 2);

  let c1 = 0;
  let c2 = 0;
  let c3 = 0;

  return headings.map(({ level, text, slug }) => {
    // When a document skips H1 and starts at H2, promote H2→1 and H3→2
    const effectiveLevel = shiftLevel ? Math.max(1, level - 1) : level;
    let path: number[];

    if (effectiveLevel === 1) {
      c1++;
      c2 = 0;
      c3 = 0;
      path = [c1];
    } else if (effectiveLevel === 2) {
      if (c1 === 0) c1 = 1;
      c2++;
      c3 = 0;
      path = [c1, c2];
    } else {
      if (c1 === 0) c1 = 1;
      if (c2 === 0) c2 = 1;
      c3++;
      path = [c1, c2, c3];
    }

    return { path, text, slug };
  });
}

/**
 * Extracts and calculates hierarchical headings directly from an HTML string.
 */
export function getHeadingsFromHtml(html: string): IndexItem[] {
  return buildHierarchicalHeadings(parseHeadings(html));
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
export function generateIndex(html: string, lang: string): string {
  const items = getHeadingsFromHtml(html);
  if (items.length === 0) return '';

  const { label, ariaLabel } = getIndexLabels(lang);

  const rows = items
    .map((item) => {
      const level = item.path.length;
      const num = `${item.path.join('.')}.`;
      const styles = getIndexRowStyles(level);

      return `
        <div class="index-row index-level-${level}" role="listitem" style="${styles.row}">
          <span class="index-num" style="${styles.num}">${num}</span>
          <a href="#${item.slug}" class="index-link" style="${styles.link}">${item.text}</a>
        </div>
      `;
    })
    .join('');

  return `
    <nav data-type="article-index" aria-label="${ariaLabel}" class="article-index-block" lang="${lang}" data-items='${JSON.stringify(
      items
    ).replace(/'/g, "&apos;")}' style="${INDEX_BLOCK_STYLES.nav}">
      <div class="index-label" style="${INDEX_BLOCK_STYLES.label}">${label}</div>
      <div class="index-list" role="list" style="${INDEX_BLOCK_STYLES.list}">
        ${rows}
      </div>
    </nav>
  `.trim();
}
