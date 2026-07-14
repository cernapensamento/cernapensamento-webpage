import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import PublicNavBar from '@/components/PublicNavBar';
import SiteFooter from '@/components/SiteFooter';
import { DEFAULT_AVATAR_URL, SITE_NAME } from '@/lib/constants';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ArticuloPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

  const { data: articulo, error } = await supabase
    .from('articulos')
    .select('*, perfiles(nombre)')
    .eq(isUUID ? 'id' : 'slug', slug)
    .single();

  if (error || !articulo) {
    notFound();
  }

  // Format date
  const fecha = new Date(articulo.creado_en).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <PublicNavBar showBackLink={true} />

      <main className="flex-grow flex flex-col items-center w-full pb-[120px]">
        <header className="w-full max-w-3xl px-5 md:px-0 pt-24 pb-12 mx-auto text-center">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">Ensayo</span>
          <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-6 max-w-4xl mx-auto leading-tight">
            {articulo.titulo}
          </h1>
          {articulo.subtitulo && (
              <p className="font-serif text-xl md:text-2xl text-charcoal/60 italic max-w-3xl mx-auto mb-6">
                {articulo.subtitulo}
              </p>
          )}
          {articulo.tematicas && articulo.tematicas.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {articulo.tematicas.map((t: string) => (
                <span key={t} className="px-4 py-1.5 border border-lines text-charcoal text-[10px] uppercase tracking-[0.2em]">{t}</span>
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
          <div className="w-full h-[60vh] min-h-[400px] mb-16 border-y border-lines bg-lines/30 relative">
            <Image className="object-cover grayscale hover:grayscale-0 transition-all duration-700" alt={articulo.titulo} src={articulo.imagen_url} fill priority />
          </div>
        )}

        <article className="w-full max-w-2xl px-5 md:px-0 mx-auto font-sans text-xl text-charcoal leading-relaxed flex flex-col gap-8 whitespace-pre-wrap">
          <div 
            className="flex flex-col gap-8 [&>p:first-of-type]:first-letter-drop [&_img]:w-full [&_img]:my-8 [&_ul]:list-disc [&_ul]:ml-8 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:ml-8 [&_ol]:my-4 [&_li]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gold [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-charcoal/80 [&_blockquote]:my-8"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(articulo.contenido, { 
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']) 
              }) 
            }}
          />

          <div className="mt-20 pt-8 border-t border-lines flex items-start gap-6">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-lines relative">
              <Image className="object-cover" alt={articulo.perfiles?.nombre || 'Autor'} src={DEFAULT_AVATAR_URL} fill sizes="32px"/>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-charcoal uppercase tracking-widest mb-2">Sobre el autor</h3>
              <p className="font-sans text-lg text-charcoal/80">
                {articulo.perfiles?.nombre || 'Autor Desconocido'} es un contribuyente de {SITE_NAME}.
              </p>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter variant="compact" />
    </>
  );
}
