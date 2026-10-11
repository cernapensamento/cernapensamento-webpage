import Link from 'next/link';
import type { LocalizedString } from '@/lib/db/types';

interface ArticleCardData {
  id: string | number;
  slug?: string | null;
  type?: string;
  tipo?: string;
  title?: LocalizedString;
  subtitle?: LocalizedString | null;
  content?: LocalizedString;
  titulo_es?: string;
  titulo_gl?: string;
  subtitulo_es?: string;
  subtitulo_gl?: string;
  contenido_es?: string;
  contenido_gl?: string;
  author?: {
    id?: string;
    full_name?: string;
    nombre?: string;
    slug?: string | null;
    avatar_url?: string | null;
  } | null;
  perfiles?: {
    nombre?: string;
    avatar_url?: string | null;
  } | null;
  cover_image_url?: string | null;
  imagen_url?: string | null;
}

interface ArticleCardProps {
  articulo: ArticleCardData;
  lang: string;
  dict?: { documentTypes?: Record<string, string>; readArticle?: string; [key: string]: unknown };
}

export default function ArticleCard({ articulo, lang, dict }: ArticleCardProps) {
  if (!articulo) return null;
  
  // Resolve localized title (new JSONB title or legacy column)
  const titulo = articulo.title
    ? (articulo.title[lang] || articulo.title.gl || articulo.title.es || '')
    : (lang === 'es' ? articulo.titulo_es : articulo.titulo_gl) || articulo.titulo_gl || articulo.titulo_es || '';

  // Resolve localized subtitle
  const subtitulo = articulo.subtitle
    ? (articulo.subtitle[lang] || articulo.subtitle.gl || articulo.subtitle.es || null)
    : (lang === 'es' ? articulo.subtitulo_es : articulo.subtitulo_gl) || articulo.subtitulo_gl || articulo.subtitulo_es || null;

  // Resolve fallback content excerpt if subtitle is absent
  const rawContent = articulo.content
    ? (articulo.content[lang] || articulo.content.gl || articulo.content.es || '')
    : (lang === 'es' ? articulo.contenido_es : articulo.contenido_gl) || '';

  // Resolve article type
  const typeKey = (articulo.type || articulo.tipo || 'article').toLowerCase();
  const typeLabel = dict?.documentTypes?.[typeKey] || dict?.documentTypes?.[typeKey === 'article' ? 'artigo' : typeKey] || typeKey;

  // Resolve author name
  const authorName = articulo.author?.full_name || articulo.author?.nombre || articulo.perfiles?.nombre || 'Autor Descoñecido';

  return (
    <Link href={`/${lang}/articulo/${articulo.slug || articulo.id}`} className="flex flex-col group cursor-pointer h-full">
      <span className="text-sm font-semibold text-gold uppercase tracking-widest mb-3">
        {typeLabel}
      </span>
      <h3 className="font-serif text-2xl text-charcoal mb-3 group-hover:text-gold transition-colors duration-300 line-clamp-3">
        {titulo}
      </h3>
      <p className="font-sans text-lg text-charcoal/80 mb-4 line-clamp-3">
        {subtitulo || (rawContent ? rawContent.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '')}
      </p>
      <div className="mt-auto border-t border-lines pt-3 w-1/3">
        <span className="text-xs font-semibold text-charcoal uppercase tracking-widest">
          {authorName}
        </span>
      </div>
    </Link>
  );
}
