import Link from 'next/link';
import Image from 'next/image';
import type { LocalizedString } from '@/lib/db/types';

export interface ArticleCardData {
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
  created_at?: string;
  creado_en?: string;
  is_pinned?: boolean | null;
  fijado?: boolean | null;
  author?: {
    id?: string;
    full_name?: string;
    nombre?: string;
    slug?: string | null;
    avatar_url?: string | null;
  } | null;
  perfiles?: {
    nombre?: string;
    slug?: string | null;
    avatar_url?: string | null;
  } | null;
  cover_image_url?: string | null;
  imagen_url?: string | null;
}

export interface ArticleCardProps {
  articulo: ArticleCardData;
  lang: string;
  dict?: { documentTypes?: Record<string, string>; readArticle?: string; [key: string]: unknown };
  variant?: 'auto' | 'standard' | 'lead' | 'textOnly' | 'compact' | 'pinned';
  className?: string;
  priority?: boolean;
}

export default function ArticleCard({
  articulo,
  lang,
  dict,
  variant = 'auto',
  className = '',
  priority = false,
}: ArticleCardProps) {
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

  const excerpt = subtitulo || (rawContent ? rawContent.replace(/<[^>]*>/g, '').substring(0, 160).trim() + '...' : '');

  // Resolve article type
  const typeKey = (articulo.type || articulo.tipo || 'article').toLowerCase();
  const typeLabel = dict?.documentTypes?.[typeKey] || dict?.documentTypes?.[typeKey === 'article' ? 'artigo' : typeKey] || typeKey;

  // Resolve author details
  const authorName = articulo.author?.full_name || articulo.author?.nombre || articulo.perfiles?.nombre || 'Autor Descoñecido';
  const authorAvatar = articulo.author?.avatar_url || articulo.perfiles?.avatar_url || null;

  // Resolve date
  const rawDate = articulo.created_at || articulo.creado_en;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString(lang === 'es' ? 'es-ES' : 'gl-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  // Resolve cover image
  const coverUrl = articulo.cover_image_url || articulo.imagen_url || null;
  const hasCover = Boolean(coverUrl && coverUrl.trim().length > 0);

  // Determine actual display style
  const effectiveVariant = variant === 'auto' ? (hasCover ? 'standard' : 'textOnly') : variant;

  const href = `/${lang}/articulo/${articulo.slug || articulo.id}`;

  // ==========================================
  // VARIANT: TEXT-ONLY EDITORIAL CARD
  // ==========================================
  if (effectiveVariant === 'textOnly' || !hasCover) {
    return (
      <article className={`group relative bg-transparent border border-lines p-7 sm:p-9 flex flex-col justify-between h-full transition-all duration-300 hover:border-gold/60 hover:shadow-md overflow-hidden ${className}`}>
        {/* Subtle decorative background watermark */}
        <span 
          aria-hidden="true" 
          className="absolute -right-3 -top-6 text-9xl font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
        >
          §
        </span>

        <div className="relative z-10">
          {/* Category & Date Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">
              {typeLabel}
            </span>
            {formattedDate && (
              <time dateTime={rawDate} className="text-xs font-sans text-charcoal/50">
                {formattedDate}
              </time>
            )}
          </div>

          {/* Headline */}
          <Link href={href} className="block">
            <h3 className="font-serif text-2xl sm:text-3xl text-charcoal group-hover:text-gold transition-colors duration-300 leading-snug line-clamp-3 mb-4">
              {titulo}
            </h3>
          </Link>

          {/* Excerpt */}
          {excerpt && (
            <p className="font-sans text-base text-charcoal/75 leading-relaxed line-clamp-4 mb-6">
              {excerpt}
            </p>
          )}
        </div>

        {/* Author Footer */}
        <div className="pt-6 border-t border-lines flex items-center justify-between relative z-10 mt-auto">
          <div className="flex items-center gap-3">
            {authorAvatar ? (
              <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 border border-lines">
                <Image src={authorAvatar} alt={authorName} fill className="object-cover" sizes="32px" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-lines/60 flex items-center justify-center text-xs font-serif text-charcoal/70 shrink-0">
                {authorName.charAt(0)}
              </div>
            )}
            <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
              {authorName}
            </span>
          </div>

          <Link href={href} className="text-xs font-bold uppercase tracking-widest text-charcoal/60 group-hover:text-gold group-hover:translate-x-1 transition-all flex items-center gap-1">
            <span>Ler</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </article>
    );
  }

  // ==========================================
  // VARIANT: LEAD / SPOTLIGHT (HORIZONTAL HERO)
  // ==========================================
  if (effectiveVariant === 'lead') {
    const byLabel = (dict?.mosaic as Record<string, string>)?.by || (dict as Record<string, string>)?.by || (lang === 'es' ? 'Por' : 'Por');
    const readLabel = (dict?.mosaic as Record<string, string>)?.readArticle || (dict as Record<string, string>)?.readArticle || (lang === 'es' ? 'Leer artículo' : 'Ler artigo');

    if (!hasCover || !coverUrl) {
      return (
        <article className={`group relative bg-transparent border border-lines p-8 sm:p-12 md:p-16 flex flex-col justify-between transition-all duration-300 hover:border-gold/60 hover:shadow-md overflow-hidden ${className}`}>
          <span 
            aria-hidden="true" 
            className="absolute -right-6 -bottom-10 text-[180px] md:text-[240px] font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
          >
            §
          </span>

          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-4 mb-5">
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                {typeLabel}
              </span>
              {formattedDate && (
                <>
                  <span className="text-charcoal/30 select-none">•</span>
                  <time dateTime={rawDate} className="text-xs font-sans text-charcoal/50">
                    {formattedDate}
                  </time>
                </>
              )}
            </div>

            <Link href={href} className="block">
              <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-charcoal group-hover:text-gold transition-colors duration-300 font-bold leading-[1.12] mb-6">
                {titulo}
              </h3>
            </Link>

            {excerpt && (
              <p className="font-sans text-lg sm:text-xl text-charcoal/80 leading-relaxed max-w-3xl mb-8">
                {excerpt}
              </p>
            )}
          </div>

          <div className="pt-6 border-t border-lines flex items-center justify-between relative z-10 mt-6">
            <div className="flex items-center gap-3.5">
              {authorAvatar ? (
                <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 border border-lines">
                  <Image src={authorAvatar} alt={authorName} fill className="object-cover" sizes="40px" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-lines/60 flex items-center justify-center text-sm font-serif text-charcoal/70 shrink-0">
                  {authorName.charAt(0)}
                </div>
              )}
              <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                {byLabel} {authorName}
              </span>
            </div>

            <Link href={href} className="text-xs font-bold uppercase tracking-widest text-charcoal/80 group-hover:text-gold group-hover:translate-x-1 transition-all flex items-center gap-1.5">
              <span>{readLabel}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      );
    }

    return (
      <article className={`group flex flex-col lg:flex-row gap-8 lg:gap-12 border border-lines bg-transparent p-6 sm:p-9 lg:p-10 h-full transition-all duration-300 hover:border-gold/60 hover:shadow-md ${className}`}>
        {/* Cinematic Landscape Cover */}
        <Link href={href} className="lg:w-3/5 aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:min-h-[400px] relative overflow-hidden bg-lines/40 block shrink-0">
          <Image
            src={coverUrl}
            alt={titulo}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Text & Metadata Container */}
        <div className="lg:w-2/5 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                {typeLabel}
              </span>
              {formattedDate && (
                <>
                  <span className="text-charcoal/30 select-none">•</span>
                  <time dateTime={rawDate} className="text-xs font-sans text-charcoal/50">
                    {formattedDate}
                  </time>
                </>
              )}
            </div>

            <Link href={href} className="block">
              <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[40px] text-charcoal group-hover:text-gold transition-colors duration-300 font-bold leading-[1.18] mb-5">
                {titulo}
              </h3>
            </Link>

            {excerpt && (
              <p className="font-sans text-base sm:text-lg text-charcoal/75 leading-relaxed line-clamp-4 lg:line-clamp-5 mb-8">
                {excerpt}
              </p>
            )}
          </div>

          <div className="pt-5 border-t border-lines flex items-center justify-between">
            <div className="flex items-center gap-3">
              {authorAvatar ? (
                <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 border border-lines">
                  <Image src={authorAvatar} alt={authorName} fill className="object-cover" sizes="32px" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-lines/60 flex items-center justify-center text-xs font-serif text-charcoal/70 shrink-0">
                  {authorName.charAt(0)}
                </div>
              )}
              <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                {byLabel} {authorName}
              </span>
            </div>

            <Link href={href} className="text-xs font-bold uppercase tracking-widest text-charcoal/70 group-hover:text-gold group-hover:translate-x-1 transition-all flex items-center gap-1.5">
              <span>{readLabel}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // ==========================================
  // VARIANT: PINNED EDITORIAL CARD
  // ==========================================
  if (effectiveVariant === 'pinned') {
    const byLabel = (dict?.mosaic as Record<string, string>)?.by || (dict as Record<string, string>)?.by || (lang === 'es' ? 'Por' : 'Por');
    const readLabel = (dict?.mosaic as Record<string, string>)?.readArticle || (dict as Record<string, string>)?.readArticle || (lang === 'es' ? 'Leer artículo' : 'Ler artigo');

    return (
      <article className={`group flex flex-col justify-between h-full transition-all duration-300 hover:border-gold/60 hover:shadow-md ${className}`}>
        <div>
          {/* Cover image if available */}
          {hasCover && coverUrl && (
            <Link href={href} className="w-full aspect-[16/9] relative overflow-hidden bg-lines/30 mb-6 block">
              <Image
                src={coverUrl}
                alt={titulo}
                fill
                priority={priority}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </Link>
          )}

          {/* Header metadata */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
              {typeLabel}
            </span>
            {formattedDate && (
              <>
                <span className="text-charcoal/30 select-none">•</span>
                <time dateTime={rawDate} className="text-xs font-sans text-charcoal/50">
                  {formattedDate}
                </time>
              </>
            )}
          </div>

          {/* Headline */}
          <Link href={href} className="block">
            <h3 className="font-serif text-2xl sm:text-3xl text-charcoal group-hover:text-gold transition-colors duration-300 font-bold leading-snug mb-3">
              {titulo}
            </h3>
          </Link>

          {/* Excerpt */}
          {excerpt && (
            <p className="font-sans text-base text-charcoal/75 leading-relaxed line-clamp-3 mb-6">
              {excerpt}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-5 border-t border-lines flex flex-wrap items-center justify-between gap-3 mt-auto">
          <div className="flex items-center gap-3">
            {authorAvatar ? (
              <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 border border-lines">
                <Image src={authorAvatar} alt={authorName} fill className="object-cover" sizes="32px" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-lines/60 flex items-center justify-center text-xs font-serif text-charcoal/70 shrink-0">
                {authorName.charAt(0)}
              </div>
            )}
            <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
              {byLabel} {authorName}
            </span>
          </div>

          <Link href={href} className="text-xs font-bold uppercase tracking-widest text-charcoal/70 group-hover:text-gold group-hover:translate-x-1 transition-all flex items-center gap-1.5 shrink-0">
            <span>{readLabel}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </article>
    );
  }

  // ==========================================
  // VARIANT: COMPACT (HORIZONTAL / LIST ITEM)
  // ==========================================
  if (effectiveVariant === 'compact') {
    return (
      <article className={`group flex items-start gap-4 pb-5 border-b border-lines/60 hover:border-gold/40 transition-colors ${className}`}>
        {hasCover && coverUrl && (
          <Link href={href} className="w-24 h-20 sm:w-32 sm:h-24 relative shrink-0 overflow-hidden bg-lines/30 block">
            <Image
              src={coverUrl}
              alt={titulo}
              fill
              sizes="128px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[10px] font-bold text-gold uppercase tracking-[0.18em] mb-1">
            {typeLabel}
          </span>
          <Link href={href}>
            <h4 className="font-serif text-base sm:text-lg text-charcoal group-hover:text-gold transition-colors duration-200 line-clamp-2 leading-snug mb-1">
              {titulo}
            </h4>
          </Link>
          <div className="flex items-center gap-2 text-xs text-charcoal/50 mt-auto">
            <span>{authorName}</span>
            {formattedDate && (
              <>
                <span>•</span>
                <time dateTime={rawDate}>{formattedDate}</time>
              </>
            )}
          </div>
        </div>
      </article>
    );
  }

  // ==========================================
  // VARIANT: STANDARD (WITH COVER)
  // ==========================================
  return (
    <article className={`group flex flex-col h-full bg-transparent transition-all duration-300 ${className}`}>
      {/* Cover Image Container */}
      <Link href={href} className="w-full aspect-[16/10] relative mb-4 overflow-hidden bg-lines/30 block">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={titulo}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center border border-lines bg-surface">
            <span className="font-serif text-4xl text-charcoal/20">§</span>
          </div>
        )}
      </Link>

      {/* Meta Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-gold uppercase tracking-[0.18em]">
          {typeLabel}
        </span>
        {formattedDate && (
          <time dateTime={rawDate} className="text-xs font-sans text-charcoal/50">
            {formattedDate}
          </time>
        )}
      </div>

      {/* Title */}
      <Link href={href} className="block mb-2">
        <h3 className="font-serif text-xl sm:text-2xl text-charcoal group-hover:text-gold transition-colors duration-300 line-clamp-2 leading-snug">
          {titulo}
        </h3>
      </Link>

      {/* Excerpt */}
      {excerpt && (
        <p className="font-sans text-sm sm:text-base text-charcoal/70 line-clamp-3 mb-4 leading-relaxed">
          {excerpt}
        </p>
      )}

      {/* Author Footer */}
      <div className="mt-auto pt-3 border-t border-lines/70 flex items-center justify-between">
        <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
          {authorName}
        </span>
        <span aria-hidden="true" className="text-xs text-charcoal/40 group-hover:text-gold group-hover:translate-x-1 transition-all">
          →
        </span>
      </div>
    </article>
  );
}
