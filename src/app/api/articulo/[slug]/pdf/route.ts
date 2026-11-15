import { getPublicationBySlug } from '@/lib/db/queries/publications';
import { PUBLICATION_STATUSES } from '@/lib/db/schema';
import { getDictionary } from '@/dictionaries';
import { buildArticlePdf } from '@/lib/pdf/articlePdf';
import { formatArticleDate } from '@/lib/date';
import { SITE_NAME } from '@/lib/constants';
import type { Locale } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';

export const runtime = 'nodejs';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cernapensamento.org').replace(/\/$/, '');

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * Renders the article as a downloadable PDF.
 *
 * The PDF is generated server-side so the reader receives a real file with
 * selectable text instead of opening the browser print dialog.
 * Uses Spanish only for `lang=es`, otherwise Galician, with content fallback to
 * the other locale. Returns 404 when lookup produces no publication (including
 * DAL failures) or 500 for caught generation errors; successful PDFs have
 * attachment and shared-cache headers. Parameter resolution errors propagate.
 */
export async function GET(request: Request, { params }: RouteContext) {
  let lang: Locale = 'gl';
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    lang = searchParams.get('lang') === 'es' ? 'es' : 'gl';

    const [publication, dict] = await Promise.all([
      getPublicationBySlug(slug, { lang }),
      getDictionary(lang),
    ]);

    if (!publication || publication.status !== PUBLICATION_STATUSES.PUBLISHED) {
      return new Response(lang === 'es' ? 'Artículo no encontrado' : 'Artigo non atopado', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const title = resolveLocalizedText(publication.title, lang);
    const subtitle = publication.subtitle ? resolveLocalizedText(publication.subtitle, lang) : null;
    const content = resolveLocalizedText(publication.content, lang);

    const date = formatArticleDate(publication.published_at || publication.created_at, lang, { format: 'long' });

    const dbBio = resolveLocalizedText(publication.author.bio, lang);
    const dictBio = publication.author.slug
      ? (dict.authors as Record<string, string>)[publication.author.slug]
      : '';

    const pdf = await buildArticlePdf({
      title,
      subtitle,
      typeLabel: dict.documentTypes?.[publication.type] || publication.type,
      authorName: publication.author.full_name,
      authorBio: dictBio || dbBio || null,
      authorNoteLabel: dict.article.aboutAuthor,
      date,
      tags: publication.tags.map((tag) => tag.name),
      coverImageUrl: publication.cover_image_url,
      html: content,
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
    });

    const filename = `cerna-${slug.replace(/[^a-zA-Z0-9-]/g, '-')}.pdf`;

    return new Response(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error generating article PDF:', error);
    const errorMsg = lang === 'es' ? 'No fue posible generar el PDF' : 'Non foi posible xerar o PDF';
    return new Response(errorMsg, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
