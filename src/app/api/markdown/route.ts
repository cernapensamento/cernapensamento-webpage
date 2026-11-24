import { NextRequest, NextResponse } from 'next/server';
import { getPublicationBySlug } from '@/lib/db/queries/publications';
import { getHomepageMarkdown, get404Markdown, formatArticleMarkdown } from '@/lib/agent/markdown';
import { getDocument } from '@/lib/content';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import { resolvePublicationLocale } from '@/lib/i18n/publicationLanguage';
import { i18n, isSupportedLocale, resolveLocale } from '@/i18n-config';
import { PUBLICATION_STATUSES } from '@/lib/db/schema';
import { SITE_URL, SITE_FULL_NAME } from '@/lib/constants';
import { getDictionaryClient } from '@/dictionaries/client';

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

      const { actualLocale } = resolvePublicationLocale(publication, lang);
      const title = resolveLocalizedText(publication.title, lang, actualLocale);
      const subtitle = resolveLocalizedText(publication.subtitle, lang, actualLocale);
      const htmlContent = resolveLocalizedText(publication.content, lang, actualLocale);
      const authorName = publication.author?.full_name || SITE_FULL_NAME;
      const canonicalUrl = `${SITE_URL}/${lang}/articulo/${publication.slug}`;

      const markdown = formatArticleMarkdown({
        title,
        subtitle,
        authorName,
        canonicalUrl,
        htmlContent,
        lang,
      });

      return new NextResponse(markdown, {
        status: 200,
        headers,
      });
    } catch (err) {
      console.error('[API:Markdown] Failed to fetch article:', err);
      return new NextResponse(getDictionaryClient(lang).markdown.article.serverError, {
        status: 500,
        headers,
      });
    }
  }

  const legalLang = rawLang || i18n.defaultLocale;
  if (type === 'legal' && (slug === 'privacidad' || slug === 'estatutos') && isSupportedLocale(legalLang)) {
    const doc = getDocument(slug, legalLang);
    if (doc?.content) {
      return new NextResponse(doc.content, {
        status: 200,
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
