import Link from 'next/link';
import Image from 'next/image';
import type { LocalizedString } from '@/lib/db/types';
import { PUBLICATION_TYPES } from '@/lib/db/schema';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface FeaturedArticleData {
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
    full_name?: string;
    nombre?: string;
    avatar_url?: string | null;
    slug?: string | null;
  } | null;
  perfiles?: {
    nombre?: string;
  } | null;
  cover_image_url?: string | null;
  imagen_url?: string | null;
}

interface FeaturedArticleHeroProps {
  articulo: FeaturedArticleData;
  lang: string;
  dict?: { documentTypes?: Record<string, string>; readArticle?: string; [key: string]: unknown };
}

export default function FeaturedArticleHero({ articulo, lang, dict }: FeaturedArticleHeroProps) {
  if (!articulo) return null;

  // Resolve localized title
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

  // Resolve type
  const typeKey = (articulo.type || articulo.tipo || PUBLICATION_TYPES.ARTICLE).toLowerCase();
  const typeLabel = dict?.documentTypes?.[typeKey] || dict?.documentTypes?.[typeKey === PUBLICATION_TYPES.ARTICLE ? 'artigo' : typeKey] || typeKey;

  // Resolve image URL
  const coverUrl = articulo.cover_image_url || articulo.imagen_url;

  // Resolve author name
  const fallbackDict = lang === 'es' ? esDict : glDict;
  const authorName = articulo.author?.full_name || articulo.author?.nombre || articulo.perfiles?.nombre || (dict?.articles as Record<string, string>)?.unknownAuthor || fallbackDict.articles.unknownAuthor;

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      <Link href={`/${lang}/articulo/${articulo.slug || articulo.id}`} className="md:col-span-7 h-[400px] md:h-[600px] relative w-full overflow-hidden bg-lines block">
        {coverUrl ? (
          <Image
            alt={titulo || "Featured article cover"}
            className="object-cover transition-all duration-700 ease-in-out"
            src={coverUrl}
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
        <span className="text-sm font-semibold text-gold uppercase tracking-widest">
          {typeLabel}
        </span>
        <Link href={`/${lang}/articulo/${articulo.slug || articulo.id}`}>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal cursor-pointer hover:text-gold transition-colors duration-300 leading-tight">
            {titulo}
          </h1>
        </Link>
        <p className="font-sans text-lg text-charcoal/80 line-clamp-4">
          {subtitulo || (rawContent ? rawContent.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '')}
        </p>
        <div className="pt-4 border-t border-lines w-1/4 mt-2">
          <span className="text-sm font-semibold text-charcoal uppercase tracking-widest">
            Por {authorName}
          </span>
        </div>
      </div>
    </section>
  );
}
