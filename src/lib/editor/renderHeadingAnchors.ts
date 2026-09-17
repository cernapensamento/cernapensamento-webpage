/**
 * renderHeadingAnchors
 *
 * Injects stable `id` attributes into every <h1>, <h2>, <h3> tag found in an
 * HTML string. The id is a URL-safe slug derived from the heading's text
 * content using the same algorithm as generateIndex.ts, so that anchor links
 * produced by the editor's index builder resolve correctly on the reader page.
 *
 * Called server-side inside the articulo reader pipeline:
 *   sanitizeHtml(renderHeadingAnchors(renderMathInHtml(contenido)), { ... })
 */

import { slugifyHeading } from './generateIndex';

/**
 * Replaces <h1>, <h2>, <h3> opening tags with versions that carry an
 * `id` attribute. Duplicate slugs get a numeric suffix (-2, -3, …).
 */
export function renderHeadingAnchors(html: string): string {
  const seen = new Map<string, number>();

  return html.replace(
    /<(h[123])([^>]*)>([\s\S]*?)<\/h[123]>/gi,
    (match, tag, attrs, inner) => {
      // Strip existing id attribute to avoid duplicates
      const cleanAttrs = attrs.replace(/\s*id="[^"]*"/gi, '');

      // Extract plain text from inner HTML (strip tags)
      const text = inner.replace(/<[^>]*>/g, '').trim();
      const baseSlug = slugifyHeading(text);

      if (!baseSlug) return match;

      const count = seen.get(baseSlug) ?? 0;
      seen.set(baseSlug, count + 1);
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

      return `<${tag}${cleanAttrs} id="${slug}">${inner}</${tag}>`;
    }
  );
}
