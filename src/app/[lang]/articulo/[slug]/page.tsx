import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import sanitizeHtml from 'sanitize-html';
import PublicNavBar from '@/components/layout/PublicNavBar';
import SiteFooter from '@/components/layout/SiteFooter';
import { DEFAULT_AVATAR_URL, SITE_NAME } from '@/lib/constants';
import CommentsSection from '@/components/features/CommentsSection';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';
import LanguageToggle from '@/components/ui/LanguageToggle';

interface Props {
  params: Promise<{ slug: string; lang: string }>;
}

export async function generateMetadata({ params }: Props) {
  const [{ slug, lang }, supabase] = await Promise.all([params, createClient()]);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

  const { data: articulo } = await supabase
    .from('articulos')
    .select('*, perfiles(nombre)')
    .eq(isUUID ? 'id' : 'slug', slug)
    .single();

  if (!articulo) {
    return { title: 'Artículo no encontrado' };
  }

  const titulo = lang === 'es' ? articulo.titulo_es : articulo.titulo_gl;
  const subtitulo = lang === 'es' ? articulo.subtitulo_es : articulo.subtitulo_gl;

  return {
    title: titulo,
    description: subtitulo || `Un artículo de ${articulo.perfiles?.nombre}`,
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
  
  const supabase = await createClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

  const { data: articulo, error } = await supabase
    .from('articulos')
    .select('*, perfiles(nombre, avatar_url, bio, slug)')
    .eq(isUUID ? 'id' : 'slug', slug)
    .single();

  if (error || !articulo) {
    notFound();
  }

  const titulo = lang === 'es' ? articulo.titulo_es : articulo.titulo_gl;
  const subtitulo = lang === 'es' ? articulo.subtitulo_es : articulo.subtitulo_gl;
  const contenido = lang === 'es' ? articulo.contenido_es : articulo.contenido_gl;

  const fecha = new Date(articulo.creado_en).toLocaleDateString(lang === 'es' ? 'es-ES' : 'gl-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let translatedTags: Record<string, string> = {};
  if (articulo.tematicas && articulo.tematicas.length > 0) {
    const { data: tagTrans } = await supabase
      .from('tags')
      .select('slug, tag_translations(lang, name)')
      .in('slug', articulo.tematicas);
    if (tagTrans) {
      tagTrans.forEach(t => {
        const trans = t.tag_translations?.find((tr: any) => tr.lang === lang);
        if (trans) {
          translatedTags[t.slug] = trans.name;
        }
      });
    }
  }

  return (
    <>
      <PublicNavBar />

      <main className="grow flex flex-col items-center w-full pb-30">
        <header className="w-full max-w-3xl px-5 md:px-0 pt-24 pb-12 mx-auto text-center relative">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">
            {(dict as any).documentTypes?.[articulo.tipo?.toLowerCase()] || articulo.tipo || 'Artigo'}
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-6 max-w-4xl mx-auto leading-tight">
            {titulo}
          </h1>
          {subtitulo && (
              <p className="font-serif text-xl md:text-2xl text-charcoal/60 italic max-w-3xl mx-auto mb-6">
                {subtitulo}
              </p>
          )}
          {articulo.tematicas && articulo.tematicas.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {articulo.tematicas.map((t: string) => (
                <span key={t} className="px-4 py-1.5 border border-lines text-charcoal text-[10px] uppercase tracking-[0.2em]">{translatedTags[t] || t}</span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-4 text-sm font-semibold text-charcoal/70 mt-10">
            <span className="text-charcoal border-b border-lines pb-1 uppercase tracking-widest">
              {articulo.perfiles?.nombre || 'Autor Desconocido'}
            </span>
            <span className="font-serif text-lines">—</span>
            <time className="uppercase tracking-widest">{fecha}</time>
          </div>
        </header>

        {articulo.imagen_url && (
          <div className="w-full max-w-4xl px-5 mx-auto mb-16">
            <Image 
              className="w-full h-auto" 
              alt={titulo} 
              src={articulo.imagen_url} 
              width={1200} 
              height={800} 
              priority 
              sizes="(max-width: 1152px) 100vw, 1152px" 
            />
          </div>
        )}

          <article className="w-full max-w-2xl px-5 md:px-0 mx-auto font-sans text-xl text-charcoal leading-relaxed flex flex-col gap-2 whitespace-pre-wrap">
          <div 
            className="prose prose-lg max-w-none text-charcoal
                        [&>p]:mb-6 [&>p]:leading-relaxed
                        [&>h2]:font-serif [&>h2]:text-3xl [&>h2]:mt-12 [&>h2]:mb-6
                        [&>h3]:font-serif [&>h3]:text-2xl [&>h3]:mt-10 [&>h3]:mb-4
                        [&>blockquote]:border-l-4 [&>blockquote]:border-gold [&>blockquote]:pl-6 [&>blockquote]:font-serif [&>blockquote]:text-2xl [&>blockquote]:italic [&>blockquote]:text-charcoal/80 [&>blockquote]:my-10
                        [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6
                        [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6
                        [&>li]:mb-2
                        [&>figure]:my-10 [&>figure]:mx-0 [&>figure]:w-full [&>figure>img]:w-full [&>figure>img]:h-auto [&>figure>img]:border [&>figure>img]:border-lines
                        [&_figure_figcaption]:mt-4 [&_figure_figcaption]:text-base [&_figure_figcaption]:text-charcoal/60 [&_figure_figcaption]:italic [&_figure_figcaption]:text-center
                        [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-gold/80"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(contenido, { 
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'iframe', 'div', 'figure', 'figcaption']),
                allowedAttributes: {
                    ...sanitizeHtml.defaults.allowedAttributes,
                    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
                    div: ['data-youtube-video']
                },
                allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'youtu.be']
              }) 
            }}
          />

          <div className="mt-20 pt-8 border-t border-lines flex flex-col md:flex-row items-start gap-6">
            <Link 
              href={`/autor/${articulo.perfiles?.slug || articulo.autor_id}`} 
              className="w-16 h-16 rounded-full overflow-hidden border border-lines relative block shrink-0"
              aria-hidden="true"
              tabIndex={-1}
            >
              <Image className="object-cover transition-all duration-700" alt="" src={articulo.perfiles?.avatar_url || DEFAULT_AVATAR_URL} fill sizes="64px"/>
            </Link>
            <div>
              <h3 id="author-heading" className="text-xs font-semibold text-charcoal uppercase tracking-widest mb-2">{dict.article.aboutAuthor}</h3>
              <p className="font-sans text-lg text-charcoal/80">
                <Link 
                  href={`/${lang}/autor/${articulo.perfiles?.slug || articulo.autor_id}`} 
                  className="hover:text-gold transition-colors font-serif font-bold text-charcoal"
                  aria-describedby="author-heading"
                >
                  {articulo.perfiles?.nombre || dict.article.unknownAuthor}
                </Link> {dict.article.contributorOf} {SITE_NAME}.
              </p>
              {((articulo.perfiles?.slug && dict.authors && (dict.authors as any)[articulo.perfiles.slug]) || articulo.perfiles?.bio) && (
                <p className="font-sans text-base text-charcoal/70 mt-3 leading-relaxed max-w-2xl">
                  {(articulo.perfiles?.slug && dict.authors && (dict.authors as any)[articulo.perfiles.slug]) || articulo.perfiles?.bio}
                </p>
              )}
            </div>
          </div>

          <CommentsSection articuloId={articulo.id} />
        </article>
      </main>

      <SiteFooter variant="compact" />
    </>
  );
}
