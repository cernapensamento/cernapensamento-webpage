import { getPublicationBySlug } from '@/lib/db/queries/publications';
import { getAuthenticatedUser } from '@/lib/auth';
import { PUBLICATION_STATUSES } from '@/lib/db/schema';
import ReviewActionBar from '@/components/escritorio/ReviewActionBar';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import 'katex/dist/katex.min.css';
import { renderMathInHtml } from '@/lib/editor/renderMath';
import { renderHeadingAnchors } from '@/lib/editor/renderHeadingAnchors';
import { DEFAULT_AVATAR_URL, SITE_NAME } from '@/lib/constants';
import CommentsSection from '@/components/features/CommentsSection';
import ArticleDownload from '@/components/features/ArticleDownload';
import ArticleScrollManager from '@/components/features/ArticleScrollManager';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';

interface Props {
  params: Promise<{ slug: string; lang: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug, lang } = await params;
  const publication = await getPublicationBySlug(slug, { lang });

  if (!publication) {
    return { title: 'Artículo no encontrado' };
  }

  const titulo = publication.title[lang] || publication.title.gl || publication.title.es;
  const subtitulo = publication.subtitle
    ? (publication.subtitle[lang] || publication.subtitle.gl || publication.subtitle.es)
    : null;

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

  const { profile } = await getAuthenticatedUser();

  const titulo = publication.title[lang] || publication.title.gl || publication.title.es;
  const subtitulo = publication.subtitle
    ? (publication.subtitle[lang] || publication.subtitle.gl || publication.subtitle.es)
    : null;
  const contenido = publication.content[lang] || publication.content.gl || publication.content.es || '';
  const isEnsaio = publication.type === 'essay';

  const fecha = new Date(publication.created_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'gl-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const authorBio = publication.author.bio
    ? (typeof publication.author.bio === 'object'
        ? (publication.author.bio[lang] || publication.author.bio.gl || publication.author.bio.es || '')
        : String(publication.author.bio))
    : '';

  const authorBioFinal = (publication.author.slug && dict.authors && (dict.authors as Record<string, string>)[publication.author.slug]) || authorBio;

  const typeLabel = dict.documentTypes?.[publication.type] || publication.type;

  return (
    <>
      <main className="flex-grow flex flex-col items-center w-full pb-30">
        <header className="w-full max-w-3xl px-5 md:px-0 pt-24 pb-12 mx-auto text-center relative">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">
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
            <span>{publication.author.full_name}</span>
            <span>•</span>
            <time dateTime={publication.created_at}>{fecha}</time>
          </div>
          {publication.original_language && publication.original_language !== lang && (
            <div className="text-[10px] text-charcoal/60 uppercase tracking-[0.15em] mt-3">
              {lang === 'es' ? 'Idioma original:' : 'Idioma orixinal:'}{' '}
              <Link href={`/${publication.original_language}/articulo/${publication.slug}`} className="text-gold font-bold hover:underline transition-all">
                {publication.original_language.toUpperCase()}
              </Link>
            </div>
          )}
        </header>

        {publication.cover_image_url && (
          <div className="w-full max-w-5xl px-5 md:px-0 mb-16 mx-auto">
            <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden bg-lines/30">
              <Image
                src={publication.cover_image_url}
                alt={titulo}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
          </div>
        )}

        <ArticleScrollManager className="w-full">
          <article className="w-full max-w-2xl px-5 md:px-0 mx-auto min-w-0">
            {publication.tags && publication.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {publication.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/${lang}/articulos?tema=${tag.slug}`}
                    className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 bg-lines/40 hover:bg-gold hover:text-parchment px-3 py-1 rounded-full transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            <div 
              className={`article-content ${isEnsaio ? 'article-content-essay' : ''}`}
              dangerouslySetInnerHTML={{ 
                __html: sanitizeHtml(renderHeadingAnchors(renderMathInHtml(contenido)), {
                  allowedTags: [
                    ...sanitizeHtml.defaults.allowedTags,
                    'img', 'iframe', 'figure', 'figcaption',
                    'span', 'div', 'hr', 'mark', 'code', 'pre', 'blockquote',
                    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
                    'math', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'ms', 'mspace', 'mtext',
                    'mfrac', 'msqrt', 'mroot', 'msub', 'msup', 'msubsup', 'munder', 'mover',
                    'munderover', 'mtable', 'mtr', 'mtd', 'mpadded', 'mphantom', 'annotation',
                    'svg', 'path', 'line', 'nav', 'u', 's', 'sub', 'sup',
                    'rect', 'mstyle', 'menclose'
                  ],
                  allowedAttributes: {
                    ...sanitizeHtml.defaults.allowedAttributes,
                    '*': ['class', 'style', 'id', 'data-type', 'data-items', 'data-colwidth'],
                    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class', 'style'],
                    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'class', 'style', 'title'],
                    figure: ['class', 'style'],
                    figcaption: ['class', 'style'],
                    div: ['class', 'style', 'data-youtube-video', 'role', 'data-latex'],
                    span: ['class', 'style', 'aria-hidden', 'data-latex', 'id'],
                    table: ['class', 'style'],
                    th: ['colspan', 'rowspan', 'colwidth', 'style', 'class'],
                    td: ['colspan', 'rowspan', 'colwidth', 'style', 'class'],
                    col: ['style', 'class', 'width'],
                    colgroup: ['style', 'class'],
                    math: ['xmlns', 'display', 'alttext'],
                    mstyle: ['displaystyle', 'scriptlevel', 'mathsize', 'mathcolor', 'mathbackground'],
                    mfrac: ['linethickness'],
                    mspace: ['width', 'height', 'depth'],
                    mpadded: ['width', 'height', 'depth', 'lspace', 'voffset'],
                    mo: ['fence', 'separator', 'stretchy', 'symmetric', 'largeop', 'movablelimits', 'accent', 'lspace', 'rspace'],
                    annotation: ['encoding'],
                    svg: ['xmlns', 'width', 'height', 'viewBox', 'style', 'preserveAspectRatio'],
                    path: ['d'],
                    line: ['x1', 'x2', 'y1', 'y2', 'stroke', 'stroke-width'],
                    rect: ['x', 'y', 'width', 'height', 'fill', 'stroke'],
                    nav: ['data-type', 'data-items', 'lang', 'class', 'style', 'aria-label'],
                    p: ['class', 'style'],
                    ul: ['style', 'class'],
                    ol: ['style', 'class'],
                    li: ['style', 'class'],
                    a: [...(sanitizeHtml.defaults.allowedAttributes['a'] ?? ['href']), 'style', 'class', 'target', 'rel'],
                    u: ['style', 'class'],
                    h1: ['id', 'style', 'class'],
                    h2: ['id', 'style', 'class'],
                    h3: ['id', 'style', 'class'],
                  },
                  allowedSchemes: ['http', 'https', 'mailto', 'data', 'blob'],
                  allowedStyles: {
                    '*': {
                      'scroll-margin-top': [/./],
                      'height': [/./],
                      'width': [/./],
                      'min-width': [/./],
                      'max-width': [/./],
                      'top': [/./],
                      'bottom': [/./],
                      'left': [/./],
                      'right': [/./],
                      'vertical-align': [/./],
                      'position': [/./],
                      'overflow': [/./],
                      'font-size': [/./],
                      'background-color': [/./],
                      'text-align': [/./],
                      'font-weight': [/./],
                      'font-family': [/./],
                      'font-variant-numeric': [/./],
                      'letter-spacing': [/./],
                      'text-transform': [/./],
                      'text-decoration': [/./],
                      'color': [/./],
                      'opacity': [/./],
                      'display': [/./],
                      'flex-direction': [/./],
                      'align-items': [/./],
                      'gap': [/./],
                      'padding': [/./],
                      'padding-top': [/./],
                      'padding-bottom': [/./],
                      'padding-left': [/./],
                      'padding-right': [/./],
                      'margin': [/./],
                      'margin-top': [/./],
                      'margin-bottom': [/./],
                      'margin-left': [/./],
                      'margin-right': [/./],
                      'border': [/./],
                      'border-top': [/./],
                      'border-bottom': [/./],
                      'border-left': [/./],
                      'border-right': [/./],
                      'border-width': [/./],
                      'border-top-width': [/./],
                      'border-bottom-width': [/./],
                      'border-left-width': [/./],
                      'border-right-width': [/./],
                      'border-color': [/./],
                      'border-style': [/./],
                      'border-radius': [/./],
                      'flex-shrink': [/./],
                      'line-height': [/./],
                      'list-style': [/./],
                      'transition': [/./],
                    },
                  },
                  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'youtu.be']
                }) 
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
        {publication.status === PUBLICATION_STATUSES.IN_REVIEW && profile && ['admin', 'founder', 'escritor'].includes(profile.role) && (
          <ReviewActionBar articuloId={publication.id} />
        )}
      </main>
    </>
  );
}
