import Link from 'next/link';
interface ArticleCardProps {
  articulo: { id: string | number; slug?: string; tipo?: string; titulo_es?: string; titulo_gl?: string; subtitulo_es?: string; subtitulo_gl?: string; contenido_es?: string; contenido_gl?: string; perfiles?: { nombre?: string }; imagen_url?: string; };
  lang: string;
  dict?: { documentTypes?: Record<string, string>; readArticle?: string; [key: string]: unknown };
}

export default function ArticleCard({ articulo, lang, dict }: ArticleCardProps) {
  if (!articulo) return null;
  
  const titulo = lang === 'es' ? articulo.titulo_es : articulo.titulo_gl;
  const subtitulo = lang === 'es' ? articulo.subtitulo_es : articulo.subtitulo_gl;
  const contenido = lang === 'es' ? articulo.contenido_es : articulo.contenido_gl;
  
  return (
    <Link href={`/${lang}/articulo/${articulo.slug || articulo.id}`} className="flex flex-col group cursor-pointer h-full">
      <span className="text-sm font-semibold text-gold uppercase tracking-widest mb-3">
        {dict?.documentTypes?.[articulo.tipo?.toLowerCase()] || articulo.tipo || 'Artigo'}
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
