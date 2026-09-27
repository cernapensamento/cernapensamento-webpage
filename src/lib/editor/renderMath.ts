import katex from 'katex';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractLatex(attrs: string): string {
  const match = attrs.match(/data-latex=(?:"([^"]*)"|'([^']*)')/);
  return match ? (match[1] !== undefined ? match[1] : match[2]) : '';
}

/**
 * Parses HTML containing TipTap mathematics nodes (<span data-type="inline-math"> and <div data-type="block-math">)
 * and renders them to KaTeX HTML strings.
 */
export function renderMathInHtml(html: string): string {
  if (!html) return '';

  let result = html;

  // Process inline-math
  const inlineRegex = /<span(?=[^>]*\bdata-type=["']inline-math["'])([^>]*)>([\s\S]*?)<\/span>/gi;
  result = result.replace(inlineRegex, (_, attrs) => {
    const rawLatex = decodeHtmlEntities(extractLatex(attrs));
    try {
      return katex.renderToString(rawLatex, { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="katex-error">$${rawLatex}$</span>`;
    }
  });

  // Process block-math
  const blockRegex = /<div(?=[^>]*\bdata-type=["']block-math["'])([^>]*)>([\s\S]*?)<\/div>/gi;
  result = result.replace(blockRegex, (_, attrs) => {
    const rawLatex = decodeHtmlEntities(extractLatex(attrs));
    try {
      return `<div class="katex-display-container my-6 text-center">${katex.renderToString(rawLatex, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<div class="katex-error">$$${rawLatex}$$</div>`;
    }
  });

  return result;
}
