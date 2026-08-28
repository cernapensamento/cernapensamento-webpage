import Link from 'next/link';
import Image from 'next/image';

interface FeaturedArticleHeroProps {
  articulo: { id: string | number; slug?: string; tipo?: string; titulo_es?: string; titulo_gl?: string; subtitulo_es?: string; subtitulo_gl?: string; contenido_es?: string; contenido_gl?: string; perfiles?: any; imagen_url?: string; };
  lang: string;
  dict?: { documentTypes?: Record<string, string>; readArticle?: string; [key: string]: unknown };
}

export default function FeaturedArticleHero({ articulo, lang, dict }: FeaturedArticleHeroProps) {
  if (!articulo) return null;

  const titulo = lang === 'es' ? articulo.titulo_es : articulo.titulo_gl;
  const subtitulo = lang === 'es' ? articulo.subtitulo_es : articulo.subtitulo_gl;
  const contenido = lang === 'es' ? articulo.contenido_es : articulo.contenido_gl;

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      <Link href={`/${lang}/articulo/${articulo.slug || articulo.id}`} className="md:col-span-7 h-[400px] md:h-[600px] relative w-full overflow-hidden bg-lines block">
        {articulo.imagen_url ? (
          <Image
            alt={titulo || "Featured article cover"}
            className="object-cover transition-all duration-700 ease-in-out"
            src={articulo.imagen_url}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl text-charcoal/20 font-serif">§</span>
          </div>
        )}
      </Link>
      <div className="md:col-span-5 flex flex-col gap-6 pt-6 md:pt-0">
        <span className="text-sm font-semibold text-gold uppercase tracking-widest">{(dict as any)?.documentTypes?.[articulo.tipo?.toLowerCase() || ''] || articulo.tipo || 'Artigo'}</span>
        <Link href={`/${lang}/articulo/${articulo.slug || articulo.id}`}>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal cursor-pointer hover:text-gold transition-colors duration-300 leading-tight">
            {titulo}
          </h1>
        </Link>
        <p className="font-sans text-lg text-charcoal/80 line-clamp-4">
          {subtitulo || (contenido?.replace(/<[^>]*>/g, '').substring(0, 150) + '...')}
        </p>
        <div className="pt-4 border-t border-lines w-1/4 mt-2">
          <span className="text-sm font-semibold text-charcoal uppercase tracking-widest">
            Por {articulo.perfiles?.nombre || 'Autor Descoñecido'}
          </span>
        </div>
      </div>
    </section>
  );
}
