import katex from 'katex';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Parses HTML containing TipTap mathematics nodes (<span data-type="inline-math"> and <div data-type="block-math">)
 * and renders them to KaTeX HTML strings.
 */
export function renderMathInHtml(html: string): string {
  if (!html) return '';

  let result = html;

  // Process inline-math
  const inlineRegex = /<span(?=[^>]*\bdata-type=["']inline-math["'])(?=[^>]*\bdata-latex=["']([^"']*)["'])[^>]*>([\s\S]*?)<\/span>/gi;
  result = result.replace(inlineRegex, (_, latex) => {
    const rawLatex = decodeHtmlEntities(latex || '');
    try {
      return katex.renderToString(rawLatex, { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="katex-error">$${rawLatex}$</span>`;
    }
  });

  // Process block-math
  const blockRegex = /<div(?=[^>]*\bdata-type=["']block-math["'])(?=[^>]*\bdata-latex=["']([^"']*)["'])[^>]*>([\s\S]*?)<\/div>/gi;
  result = result.replace(blockRegex, (_, latex) => {
    const rawLatex = decodeHtmlEntities(latex || '');
    try {
      return `<div class="katex-display-container my-6 text-center">${katex.renderToString(rawLatex, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<div class="katex-error">$$${rawLatex}$$</div>`;
    }
  });

  return result;
}
