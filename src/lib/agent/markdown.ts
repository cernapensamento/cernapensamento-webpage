import Negotiator from 'negotiator';
import { NextResponse, type NextRequest } from 'next/server';
import { isHomepagePath, isKnownPath } from '@/lib/routes';
import { i18n, resolveLocale } from '@/i18n-config';
import { SITE_URL } from '@/lib/constants';
import { getDictionaryClient } from '@/dictionaries/client';

/**
 * Strips HTML tags and preserves basic formatting in plain Markdown.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n\n#### $1\n\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n\n> $1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n- $1')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a\b[^>]*href=(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>|<[^>]+>/gi,
      (_match, doubleQuotedUrl: string | undefined, singleQuotedUrl: string | undefined, text: string) => {
        const url = doubleQuotedUrl ?? singleQuotedUrl;
        if (url === undefined) return '';
        const destination = url.replace(/[<>\\\x00-\x20]/g, (character) => encodeURIComponent(character));
        return `[${text.replace(/<[^>]+>/g, '')}](<${destination}>)`;
      })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

function interpolateMarkdownTemplate(template: string, resolvedLocale: string): string {
  return template
    .replaceAll('{siteUrl}', SITE_URL)
    .replaceAll('{lang}', resolvedLocale);
}

/**
 * Formats an article or publication into an agent-friendly Markdown document.
 */
export function formatArticleMarkdown({
  title,
  subtitle,
  authorName,
  canonicalUrl,
  htmlContent,
  lang,
}: {
  title: string;
  subtitle?: string | null;
  authorName: string;
  canonicalUrl: string;
  htmlContent: string;
  lang?: string;
}): string {
  const resolvedLocale = resolveLocale(lang);
  const articleDict = getDictionaryClient(resolvedLocale).markdown.article;

  let markdown = `# ${title}\n\n`;
  if (subtitle) {
    markdown += `> ${subtitle}\n\n`;
  }
  markdown += `*${articleDict.authorLabel}:* ${authorName}  \n`;
  markdown += `*${articleDict.publicationLabel}:* [${canonicalUrl}](${canonicalUrl})  \n\n`;
  markdown += `---\n\n`;
  markdown += htmlToMarkdown(htmlContent);
  return markdown;
}

/**
 * Generates an agent-friendly Markdown error body for HTTP 404 responses.
 * Strictly satisfies the requirement of >= 20 characters and links to sitemap and llms.txt.
 */
export function get404Markdown(locale: string = i18n.defaultLocale): string {
  const resolvedLocale = resolveLocale(locale);
  const template = getDictionaryClient(resolvedLocale).markdown.notFound;
  return interpolateMarkdownTemplate(template, resolvedLocale);
}

/**
 * Generates a clean, structured Markdown representation of the Cerna Pensamento homepage
 * for AI agents requesting Accept: text/markdown.
 */
export function getHomepageMarkdown(locale: string = i18n.defaultLocale): string {
  const resolvedLocale = resolveLocale(locale);
  const template = getDictionaryClient(resolvedLocale).markdown.homepage;
  return interpolateMarkdownTemplate(template, resolvedLocale);
}

export { isHomepagePath, isKnownPath } from '@/lib/routes';

/**
 * Negotiates and handles Markdown representation responses for AI agents (acceptmarkdown.com).
 * Returns NextResponse (direct markdown or internal rewrite) if the client requested markdown,
 * or null if standard HTML rendering should proceed.
 */
export function handleMarkdownNegotiation(
  request: NextRequest,
  pathname: string,
  currentLocale: string
): NextResponse | null {
  if (!prefersMarkdown(request.headers.get('accept'))) return null;

  const mdHeaders = {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Vary': 'Accept',
  };

  // 1. 404 representation for unknown paths
  if (!isKnownPath(pathname)) {
    return new NextResponse(get404Markdown(currentLocale), { status: 404, headers: mdHeaders });
  }

  // 2. Homepage representation
  if (isHomepagePath(pathname)) {
    return new NextResponse(getHomepageMarkdown(currentLocale), { status: 200, headers: mdHeaders });
  }

  const localePattern = i18n.locales
    .map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  // 3. Article representation
  const articleMatch = pathname.match(new RegExp(`^(?:\\/(?:${localePattern}))?\\/articulo\\/([^/]+)$`));
  if (articleMatch) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/markdown';
    url.searchParams.set('type', 'article');
    url.searchParams.set('slug', articleMatch[1]);
    url.searchParams.set('lang', currentLocale);
    return NextResponse.rewrite(url, { headers: { 'Vary': 'Accept' } });
  }

  // 4. Legal / About representation
  const legalMatch = pathname.match(new RegExp(`^(?:\\/(?:${localePattern}))?\\/(privacidad|privacy|asociacion\\/estatutos)$`));
  if (legalMatch) {
    const slug = legalMatch[1].includes('estatutos') ? 'estatutos' : 'privacidad';
    const url = request.nextUrl.clone();
    url.pathname = '/api/markdown';
    url.searchParams.set('type', 'legal');
    url.searchParams.set('slug', slug);
    url.searchParams.set('lang', currentLocale);
    return NextResponse.rewrite(url, { headers: { 'Vary': 'Accept' } });
  }

  return null;
}
