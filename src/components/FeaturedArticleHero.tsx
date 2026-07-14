import Link from 'next/link';
import Image from 'next/image';

interface FeaturedArticleHeroProps {
  articulo: any;
}

export default function FeaturedArticleHero({ articulo }: FeaturedArticleHeroProps) {
  if (!articulo) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      <Link href={`/articulo/${articulo.slug || articulo.id}`} className="md:col-span-7 h-[400px] md:h-[600px] relative w-full overflow-hidden bg-lines block">
        {articulo.imagen_url ? (
          <Image
            alt={articulo.titulo || "Featured article cover"}
            className="object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-in-out"
            src={articulo.imagen_url}
            fill
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl text-charcoal/20 font-serif">§</span>
          </div>
        )}
      </Link>
      <div className="md:col-span-5 flex flex-col gap-6 pt-6 md:pt-0">
        <span className="text-sm font-semibold text-gold uppercase tracking-widest">Destacado</span>
        <Link href={`/articulo/${articulo.slug || articulo.id}`}>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal cursor-pointer hover:text-gold transition-colors duration-300 leading-tight">
            {articulo.titulo}
          </h1>
        </Link>
        <p className="font-sans text-lg text-charcoal/80 line-clamp-4">
          {articulo.subtitulo || (articulo.contenido.replace(/<[^>]*>/g, '').substring(0, 150) + '...')}
        </p>
        <div className="pt-4 border-t border-lines w-1/4 mt-2">
          <span className="text-sm font-semibold text-charcoal uppercase tracking-widest">
            Por {articulo.perfiles?.nombre || 'Autor Desconocido'}
          </span>
        </div>
      </div>
    </section>
  );
}
