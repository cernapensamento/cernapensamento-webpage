import { NextRequest, NextResponse } from 'next/server';
import { getPublicationBySlug } from '@/lib/db/queries/publications';
import { getHomepageMarkdown, get404Markdown, htmlToMarkdown } from '@/lib/agent/markdown';
import { getDocument } from '@/lib/content';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import { i18n, isSupportedLocale, resolveLocale } from '@/i18n-config';
import { PUBLICATION_STATUSES } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'home';
  const rawLang = searchParams.get('lang');
  const lang = resolveLocale(rawLang);
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
      const publication = await getPublicationBySlug(slug, { lang, throwOnError: true });

      if (!publication || publication.status !== PUBLICATION_STATUSES.PUBLISHED) {
        return new NextResponse(get404Markdown(lang), {
          status: 404,
          headers,
        });
      }

      const title = resolveLocalizedText(publication.title, lang);
      const subtitle = resolveLocalizedText(publication.subtitle, lang);
      const rawContent = resolveLocalizedText(publication.content, lang);
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
      return new NextResponse('# 500 - Internal Server Error', {
        status: 500,
        headers,
      });
    }
  }

  const legalLang = rawLang || i18n.defaultLocale;
  if (type === 'legal' && (slug === 'privacidad' || slug === 'estatutos') && isSupportedLocale(legalLang)) {
    try {
      const doc = getDocument(slug, legalLang);
      if (!doc || !doc.content) {
        return new NextResponse(get404Markdown(legalLang), {
          status: 404,
          headers,
        });
      }

      return new NextResponse(doc.content, {
        status: 200,
        headers,
      });
    } catch {
      return new NextResponse(get404Markdown(legalLang), {
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
