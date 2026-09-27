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

import { slugifyHeading, stripHeadingNumbering } from './generateIndex';

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

      // Extract plain text from inner HTML (strip tags, math delimiters, collapse whitespace)
      const rawText = inner
        .replace(/<[^>]*>/g, '')          // strip tags
        .replace(/\$\$[\s\S]*?\$\$/g, '') // strip block math
        .replace(/\$[^$]*?\$/g, '')       // strip inline math
        .replace(/\s+/g, ' ')
        .trim();

      const text = stripHeadingNumbering(rawText) || rawText;
      const rawSlug = slugifyHeading(rawText);
      const cleanSlug = slugifyHeading(text);
      const baseSlug = rawSlug || cleanSlug;

      if (!baseSlug) return match;

      const count = seen.get(baseSlug) ?? 0;
      seen.set(baseSlug, count + 1);
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

      let finalAttrs = cleanAttrs;
      if (/style="/i.test(finalAttrs)) {
        finalAttrs = finalAttrs.replace(/style="/i, 'style="scroll-margin-top: 9rem; ');
      } else {
        finalAttrs = `${finalAttrs} style="scroll-margin-top: 9rem;"`;
      }

      let aliasHtml = '';
      if (cleanSlug && cleanSlug !== slug) {
        aliasHtml = `<span id="${cleanSlug}" style="scroll-margin-top: 9rem; display: block; height: 0; overflow: hidden;"></span>`;
      }

      return `${aliasHtml}<${tag}${finalAttrs} id="${slug}">${inner}</${tag}>`;
    }
  );
}
