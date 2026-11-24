import Link from 'next/link';
import Image from 'next/image';
import { getDictionaryClient } from '@/dictionaries/client';
import FormattedDate from '@/components/ui/FormattedDate';
import { AlternateLocaleBadge } from '@/components/ui/AlternateLocaleBadge';
import {
  resolveAlternateLocaleBadge,
  resolvePublicationAuthor,
  resolvePublicationContent,
  resolvePublicationCover,
  resolvePublicationDate,
  resolvePublicationExcerpt,
  resolvePublicationHref,
  resolvePublicationLabels,
  resolvePublicationSubtitle,
  resolvePublicationTitle,
  resolvePublicationTypeLabel,
  type LocalizablePublication,
} from './publicationCardHelpers';

export type ArticleCardData = LocalizablePublication & {
  is_pinned?: boolean | null;
  fijado?: boolean | null;
};

export interface ArticleCardProps {
  articulo: ArticleCardData;
  lang: string;
  dict?: {
    documentTypes?: Record<string, string>;
    readArticle?: string;
    articles?: Record<string, unknown>;
    mosaic?: Record<string, unknown>;
    [key: string]: unknown;
  };
  variant?: 'auto' | 'standard' | 'lead' | 'textOnly' | 'compact' | 'pinned';
  className?: string;
  priority?: boolean;
}

function AuthorAvatar({
  avatar,
  name,
  size = 'sm',
}: {
  avatar: string | null;
  name: string;
  size?: 'sm' | 'md';
}) {
  const dimensionClass = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  const fallbackTextClass = size === 'md' ? 'text-sm' : 'text-xs';
  const imageSizes = size === 'md' ? '40px' : '32px';

  if (avatar) {
    return (
      <div className={`${dimensionClass} rounded-full overflow-hidden relative shrink-0 border border-lines`}>
        <Image src={avatar} alt={name} fill className="object-cover" sizes={imageSizes} />
      </div>
    );
  }

  return (
    <div
      className={`${dimensionClass} rounded-full bg-lines/60 flex items-center justify-center ${fallbackTextClass} font-serif text-charcoal/70 shrink-0`}
    >
      {name.charAt(0)}
    </div>
  );
}

function CardTagBadges({
  labels,
  size = 'sm',
  hoverBorder = false,
}: {
  labels: string[];
  size?: 'sm' | 'md';
  hoverBorder?: boolean;
}) {
  const sizeClass =
    size === 'md'
      ? 'text-xs px-3.5 py-1.5'
      : 'text-[10px] sm:text-[11px] px-2.5 py-1';
  const hoverClass = hoverBorder ? 'group-hover:border-gold/60 transition-all' : '';

  return (
    <div className={`flex flex-wrap items-center ${size === 'md' ? 'gap-2' : 'gap-1.5'}`}>
      {labels.map((lbl) => (
        <span
          key={lbl}
          className={`font-mono font-bold uppercase tracking-[0.18em] text-charcoal/80 dark:text-[#c4c1ba] bg-surface dark:bg-white/[0.04] border border-lines dark:border-white/15 ${sizeClass} ${hoverClass}`.trim()}
        >
          {lbl}
        </span>
      ))}
    </div>
  );
}

function ForwardArrow() {
  return (
    <span
      className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1"
      aria-hidden="true"
    >
      arrow_forward
    </span>
  );
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

  const fallbackDict = getDictionaryClient(lang);
  const articlesDict = dict?.articles as Record<string, string> | undefined;
  const mosaicDict = dict?.mosaic as Record<string, string> | undefined;

  const titulo = resolvePublicationTitle(articulo, lang);
  const subtitulo = resolvePublicationSubtitle(articulo, lang);
  const rawContent = resolvePublicationContent(articulo, lang);
  const excerpt = resolvePublicationExcerpt(subtitulo, rawContent, 160);

  const typeLabel = resolvePublicationTypeLabel(
    articulo.type || articulo.tipo,
    dict?.documentTypes,
    fallbackDict
  );
  const displayLabels = resolvePublicationLabels(articulo, {
    documentTypes: dict?.documentTypes,
    fallbackDict,
  });
  const alternateLocaleBadge = resolveAlternateLocaleBadge(articulo, lang, dict, fallbackDict);

  const unknownAuthor = articlesDict?.unknownAuthor || fallbackDict.articles.unknownAuthor;
  const { name: authorName, avatar: authorAvatar } = resolvePublicationAuthor(
    articulo,
    unknownAuthor
  );

  const byLabel =
    mosaicDict?.by ||
    articlesDict?.by ||
    (dict as Record<string, string> | undefined)?.by ||
    fallbackDict.articles.by;
  const readLabel =
    mosaicDict?.readArticle ||
    articlesDict?.readArticle ||
    dict?.readArticle ||
    fallbackDict.articles.readArticle;
  const readShortLabel = articlesDict?.readShort || fallbackDict.articles.readShort;

  const rawDate = resolvePublicationDate(articulo);
  const coverUrl = resolvePublicationCover(articulo);
  const hasCover = Boolean(coverUrl);
  const effectiveVariant = variant === 'auto' ? (hasCover ? 'standard' : 'textOnly') : variant;
  const href = resolvePublicationHref(articulo, lang);

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
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <CardTagBadges labels={displayLabels} />
              <AlternateLocaleBadge label={alternateLocaleBadge} />
            </div>
            <FormattedDate
              date={rawDate}
              lang={lang}
              format="short"
              className="text-xs font-sans text-charcoal/50"
            />
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
            <AuthorAvatar avatar={authorAvatar} name={authorName} />
            <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
              {authorName}
            </span>
          </div>

          <Link href={href} className="text-xs font-bold uppercase tracking-widest text-charcoal/60 group-hover:text-gold transition-all flex items-center gap-1.5">
            <span>{readShortLabel}</span>
            <ForwardArrow />
          </Link>
        </div>
      </article>
    );
  }

  // ==========================================
  // VARIANT: LEAD / SPOTLIGHT (HORIZONTAL HERO)
  // ==========================================
  if (effectiveVariant === 'lead') {
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
            {rawDate && (
              <div className="flex items-center gap-2 mb-4">
                <span className="w-4 h-[1.5px] bg-gold" aria-hidden="true" />
                <FormattedDate
                  date={rawDate}
                  lang={lang}
                  format="short"
                  className="text-xs font-mono uppercase tracking-wider text-charcoal/60 dark:text-white/60"
                />
              </div>
            )}

            <Link href={href} className="block">
              <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-charcoal dark:text-white group-hover:text-gold transition-colors duration-300 font-bold leading-[1.12] mb-6">
                {titulo}
              </h3>
            </Link>

            {excerpt && (
              <p className="font-sans text-lg sm:text-xl text-charcoal/80 dark:text-white/80 leading-relaxed max-w-3xl mb-6">
                {excerpt}
              </p>
            )}

            {/* Labels appended below subtitle for the main spotlight article */}
            {(displayLabels.length > 0 || alternateLocaleBadge) && (
              <div className="mb-8 flex flex-wrap items-center gap-2">
                <CardTagBadges labels={displayLabels} size="md" hoverBorder />
                <AlternateLocaleBadge label={alternateLocaleBadge} />
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-lines dark:border-white/10 flex items-center justify-between relative z-10 mt-6">
            <div className="flex items-center gap-3.5">
              <AuthorAvatar avatar={authorAvatar} name={authorName} size="md" />
              <span className="text-xs font-bold text-charcoal dark:text-white uppercase tracking-wider">
                {byLabel} {authorName}
              </span>
            </div>

            <Link href={href} className="text-xs font-bold uppercase tracking-widest text-charcoal/80 dark:text-white/80 group-hover:text-gold transition-all flex items-center gap-1.5">
              <span>{readLabel}</span>
              <ForwardArrow />
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
            {rawDate && (
              <div className="flex items-center gap-2 mb-3">
                <span className="w-4 h-[1.5px] bg-gold" aria-hidden="true" />
                <FormattedDate
                  date={rawDate}
                  lang={lang}
                  format="short"
                  className="text-xs font-mono uppercase tracking-wider text-charcoal/60 dark:text-white/60"
                />
              </div>
            )}

            <Link href={href} className="block">
              <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[40px] text-charcoal dark:text-white group-hover:text-gold transition-colors duration-300 font-bold leading-[1.18] mb-4">
                {titulo}
              </h3>
            </Link>

            {excerpt && (
              <p className="font-sans text-base sm:text-lg text-charcoal/75 dark:text-white/75 leading-relaxed line-clamp-4 lg:line-clamp-5 mb-5">
                {excerpt}
              </p>
            )}

            {/* Labels appended below subtitle for the main spotlight article */}
            {(displayLabels.length > 0 || alternateLocaleBadge) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <CardTagBadges labels={displayLabels} size="md" hoverBorder />
                <AlternateLocaleBadge label={alternateLocaleBadge} />
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-lines dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AuthorAvatar avatar={authorAvatar} name={authorName} />
              <span className="text-xs font-bold text-charcoal dark:text-white uppercase tracking-wider">
                {byLabel} {authorName}
              </span>
            </div>

            <Link href={href} className="text-xs font-bold uppercase tracking-widest text-charcoal/70 dark:text-white/75 group-hover:text-gold transition-all flex items-center gap-1.5">
              <span>{readLabel}</span>
              <ForwardArrow />
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
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <CardTagBadges labels={displayLabels} />
            <AlternateLocaleBadge label={alternateLocaleBadge} />
            {rawDate && (
              <>
                <span className="text-charcoal/30 select-none">•</span>
                <FormattedDate
                  date={rawDate}
                  lang={lang}
                  format="short"
                  className="text-xs font-sans text-charcoal/50"
                />
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
            <AuthorAvatar avatar={authorAvatar} name={authorName} />
            <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
              {byLabel} {authorName}
            </span>
          </div>

          <Link href={href} className="text-xs font-bold uppercase tracking-widest text-charcoal/70 group-hover:text-gold transition-all flex items-center gap-1.5 shrink-0">
            <span>{readLabel}</span>
            <ForwardArrow />
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
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-gold uppercase tracking-[0.18em]">
              {typeLabel}
            </span>
            <AlternateLocaleBadge label={alternateLocaleBadge} />
          </div>
          <Link href={href}>
            <h4 className="font-serif text-base sm:text-lg text-charcoal group-hover:text-gold transition-colors duration-200 line-clamp-2 leading-snug mb-1">
              {titulo}
            </h4>
          </Link>
          <div className="flex items-center gap-2 text-xs text-charcoal/50 mt-auto">
            <span>{authorName}</span>
            {rawDate && (
              <>
                <span>•</span>
                <FormattedDate date={rawDate} lang={lang} format="short" />
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <CardTagBadges labels={displayLabels} />
          <AlternateLocaleBadge label={alternateLocaleBadge} />
        </div>
        <FormattedDate
          date={rawDate}
          lang={lang}
          format="short"
          className="text-xs font-sans text-charcoal/50"
        />
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
        <span aria-hidden="true" className="text-xs text-charcoal/40 group-hover:text-gold transition-all">
          <ForwardArrow />
        </span>
      </div>
    </article>
  );
}
