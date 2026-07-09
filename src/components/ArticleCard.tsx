import Link from 'next/link';

interface ArticleCardProps {
  articulo: any;
}

export default function ArticleCard({ articulo }: ArticleCardProps) {
  if (!articulo) return null;
  
  return (
    <Link href={`/articulo/${articulo.slug || articulo.id}`} className="flex flex-col group cursor-pointer h-full">
      <span className="text-sm font-semibold text-gold uppercase tracking-widest mb-3">Ensayo Comunitario</span>
      <h3 className="font-serif text-2xl text-charcoal mb-3 group-hover:text-gold transition-colors duration-300 line-clamp-3">
        {articulo.titulo}
      </h3>
      <p className="font-sans text-lg text-charcoal/80 mb-4 line-clamp-3">
        {articulo.contenido.replace(/<[^>]*>/g, '')}
      </p>
      <div className="mt-auto border-t border-lines pt-3 w-1/3">
        <span className="text-xs font-semibold text-charcoal uppercase tracking-widest">
          {articulo.perfiles?.nombre || 'Autor Desconocido'}
        </span>
      </div>
    </Link>
  );
}
