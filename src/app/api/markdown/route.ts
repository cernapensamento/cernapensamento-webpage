import { NextRequest, NextResponse } from 'next/server';
import { getPublicationBySlug } from '@/lib/db/queries/publications';
import { getHomepageMarkdown, get404Markdown } from '@/lib/agent/markdown';
import { getDocument } from '@/lib/content';

/**
 * Strips HTML tags and preserves basic formatting in plain Markdown.
 */
function htmlToMarkdown(html: string): string {
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
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'home';
  const lang = searchParams.get('lang') || 'gl';
  const slug = searchParams.get('slug');

  const headers = {
    'Content-Type': 'text/markdown; charset=utf-8',
    Vary: 'Accept',
  };

  if (type === 'home') {
    return new NextResponse(getHomepageMarkdown(lang), {
      status: 200,
      headers,
    });
  }

  if (type === 'article' && slug) {
    try {
      const publication = await getPublicationBySlug(slug, { lang });

      if (!publication) {
        return new NextResponse(get404Markdown(lang), {
          status: 404,
          headers,
        });
      }

      const title =
        publication.title[lang] || publication.title.gl || publication.title.es || '';
      const subtitle = publication.subtitle
        ? publication.subtitle[lang] || publication.subtitle.gl || publication.subtitle.es
        : '';
      const rawContent =
        publication.content[lang] || publication.content.gl || publication.content.es || '';
      const authorName = publication.author?.full_name || 'Cerna Pensamento';
      const canonicalUrl = `https://cernapensamento.org/${lang}/articulo/${publication.slug}`;

      let markdown = `# ${title}\n\n`;
      if (subtitle) {
        markdown += `> ${subtitle}\n\n`;
      }
      markdown += `*Autor:* ${authorName}  \n`;
      markdown += `*Publicación:* [${canonicalUrl}](${canonicalUrl})  \n\n`;
      markdown += `---\n\n`;
      markdown += htmlToMarkdown(rawContent);

      return new NextResponse(markdown, {
        status: 200,
        headers,
      });
    } catch (err) {
      console.error('[API:Markdown] Failed to fetch article:', err);
      return new NextResponse(get404Markdown(lang), {
        status: 404,
        headers,
      });
    }
  }

  if (type === 'legal' && slug) {
    try {
      const doc = getDocument(slug, lang);
      if (!doc || !doc.content) {
        return new NextResponse(get404Markdown(lang), {
          status: 404,
          headers,
        });
      }

      return new NextResponse(doc.content, {
        status: 200,
        headers,
      });
    } catch {
      return new NextResponse(get404Markdown(lang), {
        status: 404,
        headers,
      });
    }
  }

  // Fallback to 404
  return new NextResponse(get404Markdown(lang), {
    status: 404,
    headers,
  });
}
