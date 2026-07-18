import Link from 'next/link';
import { cookies } from 'next/headers';

interface ArticleCardProps {
  articulo: any;
}

export default async function ArticleCard({ articulo }: ArticleCardProps) {
  if (!articulo) return null;
  
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'gl';
  
  const titulo = locale === 'es' ? articulo.titulo_es : articulo.titulo_gl;
  const subtitulo = locale === 'es' ? articulo.subtitulo_es : articulo.subtitulo_gl;
  const contenido = locale === 'es' ? articulo.contenido_es : articulo.contenido_gl;
  
  return (
    <Link href={`/articulo/${articulo.slug || articulo.id}`} className="flex flex-col group cursor-pointer h-full">
      <span className="text-sm font-semibold text-gold uppercase tracking-widest mb-3">
        {articulo.tipo || 'Artigo'}
      </span>
      <h3 className="font-serif text-2xl text-charcoal mb-3 group-hover:text-gold transition-colors duration-300 line-clamp-3">
        {titulo}
      </h3>
      <p className="font-sans text-lg text-charcoal/80 mb-4 line-clamp-3">
        {subtitulo || (contenido?.replace(/<[^>]*>/g, '').substring(0, 150) + '...')}
      </p>
      <div className="mt-auto border-t border-lines pt-3 w-1/3">
        <span className="text-xs font-semibold text-charcoal uppercase tracking-widest">
          {articulo.perfiles?.nombre || 'Autor Desconocido'}
        </span>
      </div>
    </Link>
  );
}
