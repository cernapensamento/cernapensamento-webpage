import Link from 'next/link';
import Image from 'next/image';

interface PinnedArticlesPanelProps {
  articulos: any[];
  lang: string;
  dict?: any;
}

export default function PinnedArticlesPanel({ articulos, lang, dict }: PinnedArticlesPanelProps) {
  if (!articulos || articulos.length === 0) return null;

  return (
    <section className="border-t border-lines pt-12">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-gold" data-icon="push_pin">push_pin</span>
        <h2 className="font-serif text-2xl md:text-3xl text-charcoal">{lang === 'es' ? 'Artículos Fijados' : 'Artigos Fixados'}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {articulos.map((articulo) => (
          <Link key={articulo.id} href={`/${lang}/articulo/${articulo.slug || articulo.id}`} className="group flex flex-col h-full cursor-pointer">
            <div className="w-full aspect-video relative mb-4 overflow-hidden bg-lines/30">
              {articulo.imagen_url ? (
                <Image 
                  src={articulo.imagen_url} 
                  alt={articulo.titulo_gl || articulo.titulo_es || 'Artículo'} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-all duration-700" 
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center border border-lines">
                  <span className="font-serif text-4xl text-charcoal/20">§</span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-2">
              {dict?.documentTypes?.[articulo.tipo?.toLowerCase()] || articulo.tipo || 'Artigo'}
            </span>
            <h3 className="font-serif text-xl md:text-2xl mb-3 group-hover:text-gold transition-colors duration-300 line-clamp-3">
              {articulo.titulo_gl || articulo.titulo_es}
            </h3>
            <p className="font-sans text-sm text-charcoal/60 line-clamp-3">
              {articulo.subtitulo_gl || articulo.subtitulo_es || String(articulo.contenido_gl || articulo.contenido_es || '').replace(/<[^>]*>?/g, '').substring(0, 100) + '...'}
            </p>
            <div className="mt-auto border-t border-lines pt-3 w-1/3">
              <span className="text-[10px] font-semibold text-charcoal/80 uppercase tracking-widest">
                {articulo.perfiles?.nombre || 'Autor Descoñecido'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
