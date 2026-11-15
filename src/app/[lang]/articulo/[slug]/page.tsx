import { getPublicationBySlug } from '@/lib/db/queries/publications';
import { PUBLICATION_STATUSES } from '@/lib/db/schema';
import ReviewActionBar from '@/components/escritorio/ReviewActionBar';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import 'katex/dist/katex.min.css';
import { renderMathInHtml } from '@/lib/editor/renderMath';
import { renderHeadingAnchors } from '@/lib/editor/renderHeadingAnchors';
import { sanitizeArticleHtml } from '@/lib/editor/sanitizeArticleHtml';
import { DEFAULT_AVATAR_URL, SITE_NAME } from '@/lib/constants';
import FormattedDate from '@/components/ui/FormattedDate';
import CommentsSection from '@/components/features/CommentsSection';
import ArticleDownload from '@/components/features/ArticleDownload';
import ArticleScrollManager from '@/components/features/ArticleScrollManager';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';

interface Props {
  params: Promise<{ slug: string; lang: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug, lang } = await params;
  const publication = await getPublicationBySlug(slug, { lang });

  if (!publication) {
    return { title: 'Artículo no encontrado' };
  }

  const titulo = resolveLocalizedText(publication.title, lang);
  const subtitulo = publication.subtitle ? resolveLocalizedText(publication.subtitle, lang) : null;

  return {
    title: titulo,
    description: subtitulo || `Un artículo de ${publication.author.full_name}`,
  };
}

export const revalidate = 60;

export default async function ArticuloPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const dict = await getDictionary(lang as Locale);
  
  const publication = await getPublicationBySlug(slug, { lang });

  if (!publication) {
    notFound();
  }

  // Canonical slug auto-redirect if accessed via a legacy or renamed slug with the same unique suffix
  if (publication.slug && publication.slug !== slug) {
    permanentRedirect(`/${lang}/articulo/${publication.slug}`);
  }

  const titulo = resolveLocalizedText(publication.title, lang);
  const subtitulo = publication.subtitle ? resolveLocalizedText(publication.subtitle, lang) : null;
  const contenido = resolveLocalizedText(publication.content, lang);
  const isEnsaio = publication.type === 'essay';

  const authorBio = publication.author.bio
    ? resolveLocalizedText(publication.author.bio, lang)
    : '';

  const authorBioFinal = (publication.author.slug && dict.authors && (dict.authors as Record<string, string>)[publication.author.slug]) || authorBio;

  const typeLabel = dict.documentTypes?.[publication.type] || publication.type;

  return (
    <>
      <main className="flex-grow flex flex-col items-center w-full pb-30">
        <header className="w-full max-w-3xl px-5 md:px-0 pt-8 sm:pt-12 pb-10 mx-auto text-center relative">
          <span className="font-mono text-xs font-bold text-gold uppercase tracking-[0.22em] block mb-4">
            {typeLabel}
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-6 max-w-4xl mx-auto leading-tight">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="font-serif text-xl md:text-2xl text-charcoal/60 italic max-w-3xl mx-auto mb-6">
              {subtitulo}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-charcoal/40 mt-8 border-y border-lines py-3">
            <Link 
              href={`/${lang}/autor/${publication.author.slug || publication.author.id}`}
              className="text-charcoal/80 hover:text-gold transition-colors font-medium hover:underline"
            >
              {publication.author.full_name}
            </Link>
            <span>•</span>
            <FormattedDate date={publication.published_at || publication.created_at} lang={lang} format="long" />
          </div>
          {publication.original_language && publication.original_language !== lang && (
            <div className="text-[10px] text-charcoal/60 uppercase tracking-[0.15em] mt-3">
              {dict.article.originalLanguage}{' '}
              <Link href={`/${publication.original_language}/articulo/${publication.slug}`} className="text-gold font-bold hover:underline transition-all">
                {publication.original_language.toUpperCase()}
              </Link>
            </div>
          )}
          {publication.tags && publication.tags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-6">
              {publication.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/${lang}/articulos?tema=${tag.slug}`}
                  className="border border-lines dark:border-white/15 bg-surface dark:bg-[#1a1a1a] px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-charcoal/80 dark:text-[#c4c1ba] hover:border-gold hover:text-gold transition-all"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {publication.cover_image_url && (
          <div className="w-full max-w-4xl px-5 md:px-0 mb-12 sm:mb-16 mx-auto flex justify-center">
            <Image
              src={publication.cover_image_url}
              alt={titulo}
              width={1400}
              height={900}
              priority
              className="w-auto h-auto max-w-full max-h-[85vh] object-contain mx-auto"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        )}

        <ArticleScrollManager className="w-full">
          <article className="w-full max-w-2xl px-5 md:px-0 mx-auto min-w-0">
            <div 
              className={`article-content ${isEnsaio ? 'article-content-essay' : ''}`}
              dangerouslySetInnerHTML={{ 
                __html: sanitizeArticleHtml(renderHeadingAnchors(renderMathInHtml(contenido)))
              }}
            />

            <div className="mt-20 pt-8 border-t border-lines flex flex-col md:flex-row items-start gap-6">
              <Link 
                href={`/${lang}/autor/${publication.author.slug || publication.author.id}`} 
                className="w-16 h-16 rounded-full overflow-hidden border border-lines relative block shrink-0"
                aria-hidden="true"
                tabIndex={-1}
              >
                <Image
                  className="object-cover transition-all duration-700"
                  alt=""
                  src={publication.author.avatar_url || DEFAULT_AVATAR_URL}
                  fill
                  sizes="64px"
                />
              </Link>
              <div>
                <h3 id="author-heading" className="text-xs font-semibold text-charcoal uppercase tracking-widest mb-2">
                  {dict.article.aboutAuthor}
                </h3>
                <p className="font-sans text-lg text-charcoal/80">
                  <Link 
                    href={`/${lang}/autor/${publication.author.slug || publication.author.id}`} 
                    className="hover:text-gold transition-colors font-serif font-bold text-charcoal"
                    aria-describedby="author-heading"
                  >
                    {publication.author.full_name || dict.article.unknownAuthor}
                  </Link> {dict.article.contributorOf} {SITE_NAME}.
                </p>
                {authorBioFinal && (
                  <p className="font-sans text-base text-charcoal/70 mt-3 leading-relaxed max-w-2xl">
                    {authorBioFinal}
                  </p>
                )}
              </div>
            </div>

            <CommentsSection publicationId={publication.id} />

            <ArticleDownload
              href={`/api/articulo/${publication.slug}/pdf?lang=${lang}`}
              eyebrow={dict.article.download.eyebrow}
              title={dict.article.download.title}
              description={dict.article.download.description}
              cta={dict.article.download.cta}
            />
          </article>
        </ArticleScrollManager>
        {publication.status === PUBLICATION_STATUSES.IN_REVIEW && (
          <ReviewActionBar articuloId={publication.id} status={publication.status} />
        )}
      </main>
    </>
  );
}
