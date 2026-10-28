'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { ArticleCardData } from '@/components/features/ArticleCard';
import { PUBLICATION_TYPES } from '@/lib/db/schema';
import FormattedDate from '@/components/ui/FormattedDate';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface RecentArticlesMosaicGridProps {
  articulos: ArticleCardData[];
  lang: string;
  dict?: {
    documentTypes?: Record<string, string>;
    readArticle?: string;
    mosaic?: {
      readArticle?: string;
      by?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

function getLocalizedTitle(item: ArticleCardData, lang: string): string {
  if (typeof item.title === 'object' && item.title !== null) {
    return item.title[lang as 'gl' | 'es'] || item.title.gl || item.title.es || '';
  }
  if (lang === 'es') return item.titulo_es || item.titulo_gl || '';
  return item.titulo_gl || item.titulo_es || '';
}

function getLocalizedSubtitle(item: ArticleCardData, lang: string): string {
  if (typeof item.subtitle === 'object' && item.subtitle !== null) {
    return item.subtitle[lang as 'gl' | 'es'] || item.subtitle.gl || item.subtitle.es || '';
  }
  if (lang === 'es') return item.subtitulo_es || item.subtitulo_gl || '';
  return item.subtitulo_gl || item.subtitulo_es || '';
}

function getLocalizedLabels(
  item: ArticleCardData,
  lang: string,
  dict?: { documentTypes?: Record<string, string> }
): string[] {
  // 1. If tags exist on the article, use all non-generic tags
  if (item.tags && item.tags.length > 0) {
    const validTags = item.tags
      .map((t) => t?.name?.trim())
      .filter((name): name is string => Boolean(name && name.toLowerCase() !== PUBLICATION_TYPES.NEWS && name.toLowerCase() !== PUBLICATION_TYPES.ARTICLE));

    if (validTags.length > 0) {
      return validTags.map((name) => name.toUpperCase());
    }
  }

  // 2. Localized publication category from dictionary
  const rawType = item.type || item.tipo || PUBLICATION_TYPES.ARTICLE;
  const fromDict = dict?.documentTypes?.[rawType];
  if (fromDict) return [fromDict.toUpperCase()];

  const fallbackDict = (lang === 'es' ? esDict.documentTypes : glDict.documentTypes) as Record<string, string>;
  const resolved = fallbackDict[rawType] || fallbackDict[PUBLICATION_TYPES.ARTICLE];
  return [resolved.toUpperCase()];
}

interface RecentArticleCardProps {
  item: ArticleCardData;
  lang: string;
  variant: 'large' | 'stacked' | 'tall';
  stackedStyle?: 'side' | 'background';
  showLabels?: boolean;
  dict?: {
    documentTypes?: Record<string, string>;
    readArticle?: string;
    mosaic?: {
      readArticle?: string;
      by?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

function RecentArticleCard({
  item,
  lang,
  variant,
  stackedStyle = 'side',
  showLabels = true,
  dict,
}: RecentArticleCardProps) {
  const title = getLocalizedTitle(item, lang);
  const subtitle = getLocalizedSubtitle(item, lang);
  const labels = getLocalizedLabels(item, lang, dict);
  const rawDate = item.created_at || item.creado_en;
  const coverUrl = item.cover_image_url || item.imagen_url;
  const hasCover = Boolean(coverUrl && coverUrl.trim().length > 0);
  const authorName = item.author?.full_name || item.author?.nombre || item.perfiles?.nombre || '';
  const readLabel = dict?.mosaic?.readArticle || dict?.readArticle || (lang === 'gl' ? 'Ler texto' : 'Leer texto');
  const href = `/${lang}/articulo/${item.slug || item.id}`;

  if (variant === 'large') {
    return (
      <Link
        href={href}
        className="group relative flex flex-col justify-end p-7 sm:p-10 border border-lines bg-parchment overflow-hidden transition-all duration-300 hover:border-gold/60 hover:shadow-xl h-full min-h-[360px] sm:min-h-[440px]"
      >
        {/* Top Gold Line on Hover */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
        />

        {/* Cover image backdrop if available */}
        {hasCover ? (
          <>
            <Image
              src={coverUrl as string}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Adaptive protective gradient: light mode parchment tone, dark mode deep charcoal */}
            <div className="absolute inset-0 bg-gradient-to-t from-parchment via-parchment/85 to-parchment/20 dark:from-black/95 dark:via-black/75 dark:to-black/30 transition-colors duration-300" />
          </>
        ) : (
          <span
            aria-hidden="true"
            className="absolute -right-4 -bottom-8 text-[180px] font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
          >
            §
          </span>
        )}

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {labels.map((lbl) => (
                <span
                  key={lbl}
                  className={`font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 border ${
                    hasCover
                      ? 'bg-parchment/90 dark:bg-black/60 backdrop-blur-sm border-lines dark:border-white/20 text-charcoal/80 dark:text-[#c4c1ba]'
                      : 'bg-surface dark:bg-white/[0.04] border-lines dark:border-white/15 text-charcoal/80 dark:text-[#c4c1ba]'
                  }`}
                >
                  {lbl}
                </span>
              ))}
            </div>
            <FormattedDate
              date={rawDate}
              lang={lang}
              format="short"
              className={`font-mono text-[11px] uppercase tracking-wider ${
                hasCover ? 'text-charcoal/70 dark:text-white/80' : 'text-charcoal/60'
              }`}
            />
          </div>

          <h3
            className={`font-serif text-2xl sm:text-3xl md:text-4xl font-bold leading-tight group-hover:text-gold transition-colors duration-300 line-clamp-3 ${
              hasCover ? 'text-charcoal dark:text-white' : 'text-charcoal'
            }`}
          >
            {title}
          </h3>

          {subtitle && (
            <p
              className={`font-sans text-xs sm:text-sm line-clamp-2 leading-relaxed max-w-2xl ${
                hasCover ? 'text-charcoal/80 dark:text-white/80' : 'text-charcoal/70'
              }`}
            >
              {subtitle}
            </p>
          )}

          <div
            className={`mt-2 pt-3 border-t flex items-center justify-between ${
              hasCover ? 'border-lines dark:border-white/20' : 'border-lines'
            }`}
          >
            <span className={`font-sans text-xs ${hasCover ? 'text-charcoal/70 dark:text-white/75' : 'text-charcoal/60'}`}>
              {authorName ? `Por ${authorName}` : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-[0.16em] text-gold">
              <span>{readLabel}</span>
              <span
                className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'tall') {
    return (
      <Link
        href={href}
        className="group relative flex flex-col justify-between p-6 sm:p-7 border border-lines bg-parchment overflow-hidden transition-all duration-300 hover:border-gold/60 hover:shadow-lg h-full min-h-[380px]"
      >
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
        />

        <div className="flex flex-col gap-3">
          {/* Top cover image if available */}
          {hasCover && (
            <div className="w-full aspect-[16/10] relative overflow-hidden bg-lines/30 mb-2 shrink-0 border border-lines/40">
              <Image
                src={coverUrl as string}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {labels.map((lbl) => (
                <span
                  key={lbl}
                  className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal/80 dark:text-[#c4c1ba] bg-surface dark:bg-white/[0.04] border border-lines dark:border-white/15 px-2.5 py-1"
                >
                  {lbl}
                </span>
              ))}
            </div>
            <FormattedDate
              date={rawDate}
              lang={lang}
              format="short"
              className="font-mono text-[10px] uppercase tracking-wider text-charcoal/60"
            />
          </div>

          <h3 className="font-serif text-xl sm:text-2xl font-bold leading-snug text-charcoal group-hover:text-gold transition-colors duration-300 line-clamp-3">
            {title}
          </h3>

          {subtitle && (
            <p className="font-sans text-xs leading-relaxed line-clamp-3 text-charcoal/70">
              {subtitle}
            </p>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-lines flex items-center justify-between">
          <span className="font-sans text-[11px] truncate text-charcoal/60">
            {authorName}
          </span>
          <span
            className="material-symbols-outlined text-base text-gold transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          >
            arrow_forward
          </span>
        </div>
      </Link>
    );
  }

  // ====================================================
  // STACKED VARIANT - OPTION A: IMAGE ON BACKGROUND (CIRCLED IN RED BY USER)
  // ====================================================
  if (variant === 'stacked' && stackedStyle === 'background') {
    return (
      <Link
        href={href}
        className="group relative flex flex-col justify-between p-5 sm:p-6 border border-lines bg-parchment overflow-hidden transition-all duration-300 hover:border-gold/60 hover:shadow-xl h-full min-h-[175px]"
      >
        {/* Top Gold Line on Hover */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
        />

        {/* Cover image backdrop if available */}
        {hasCover ? (
          <>
            <Image
              src={coverUrl as string}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Adaptive protective gradient: light mode parchment tone, dark mode deep charcoal */}
            <div className="absolute inset-0 bg-gradient-to-t from-parchment via-parchment/85 to-parchment/20 dark:from-black/95 dark:via-black/75 dark:to-black/30 transition-colors duration-300" />
          </>
        ) : (
          <span
            aria-hidden="true"
            className="absolute -right-3 -bottom-6 text-8xl font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
          >
            §
          </span>
        )}

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              {showLabels ? (
                <div className="flex flex-wrap items-center gap-1">
                  {labels.map((lbl) => (
                    <span
                      key={lbl}
                      className={`font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 border ${
                        hasCover
                          ? 'bg-parchment/90 dark:bg-black/60 backdrop-blur-sm border-lines dark:border-white/20 text-charcoal/90 dark:text-[#e0deda]'
                          : 'bg-surface dark:bg-white/[0.04] border-lines dark:border-white/15 text-charcoal/80 dark:text-[#c4c1ba]'
                      }`}
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              ) : null}
              <FormattedDate
                date={rawDate}
                lang={lang}
                format="short"
                className={`font-mono text-[10px] uppercase tracking-wider ${
                  hasCover ? 'text-charcoal/70 dark:text-white/80' : 'text-charcoal/60'
                } ${!showLabels ? 'ml-auto' : ''}`}
              />
            </div>

            <h3
              className={`font-serif text-base sm:text-lg font-bold leading-snug group-hover:text-gold transition-colors duration-300 line-clamp-2 mt-2 ${
                hasCover ? 'text-charcoal dark:text-white' : 'text-charcoal'
              }`}
            >
              {title}
            </h3>
          </div>

          <div
            className={`pt-2 flex items-center justify-between text-[11px] border-t mt-3 ${
              hasCover ? 'border-lines dark:border-white/20' : 'border-lines'
            }`}
          >
            <span className={`font-sans truncate ${hasCover ? 'text-charcoal/70 dark:text-white/75' : 'text-charcoal/60'}`}>
              {authorName}
            </span>
            <span
              className="material-symbols-outlined text-base text-gold transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // ====================================================
  // STACKED VARIANT - OPTION B: SIDE THUMBNAIL (STANDARD)
  // ====================================================
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between p-5 sm:p-6 border border-lines bg-parchment overflow-hidden transition-all duration-300 hover:border-gold/60 hover:shadow-md h-full min-h-[175px]"
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
      />

      <div className="flex gap-4 items-stretch h-full">
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap items-center gap-1">
                {labels.map((lbl) => (
                  <span
                    key={lbl}
                    className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-charcoal/80 dark:text-[#c4c1ba] bg-surface dark:bg-white/[0.04] border border-lines dark:border-white/15 px-2 py-0.5"
                  >
                    {lbl}
                  </span>
                ))}
              </div>
              <FormattedDate
                date={rawDate}
                lang={lang}
                format="short"
                className="font-mono text-[10px] uppercase tracking-wider text-charcoal/60"
              />
            </div>

            <h3 className="font-serif text-base sm:text-lg font-bold leading-snug text-charcoal group-hover:text-gold transition-colors duration-300 line-clamp-2">
              {title}
            </h3>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px]">
            <span className="font-sans truncate text-charcoal/60">
              {authorName}
            </span>
            <span
              className="material-symbols-outlined text-base text-gold transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </div>
        </div>

        {/* Thumbnail on side if article has cover image */}
        {hasCover && (
          <div className="w-20 sm:w-24 relative overflow-hidden shrink-0 border border-lines/40 aspect-square sm:aspect-auto">
            <Image
              src={coverUrl as string}
              alt={title}
              fill
              sizes="100px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        )}
      </div>
    </Link>
  );
}

export default function RecentArticlesMosaicGrid({
  articulos,
  lang,
  dict,
}: RecentArticlesMosaicGridProps) {
  if (!articulos || articulos.length === 0) {
    return null;
  }

  // 9 articles partitioned into 3 balanced asymmetric rows of 3 items each
  const item0 = articulos[0];
  const item1 = articulos[1]; // Circled in RED -> image on background
  const item2 = articulos[2]; // Large
  const item3 = articulos[3]; // Tall
  const item4 = articulos[4]; // Tall
  const item5 = articulos[5]; // Tall
  const item6 = articulos[6]; // Large
  const item7 = articulos[7]; // Circled in RED -> image on background
  const item8 = articulos[8];

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8">
      
      {/* ==================================================== */}
      {/* ROW 1 (3 items): 2 STACKED (LEFT, 4 cols) + 1 LARGE (RIGHT, 8 cols) */}
      {/* ==================================================== */}
      {(item0 || item1 || item2) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {(item0 || item1) && (
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-6 sm:gap-8 h-full justify-between">
              {item0 && (
                <RevealOnScroll delayMs={50} className="flex-1">
                  <RecentArticleCard item={item0} lang={lang} variant="stacked" stackedStyle="background" showLabels={false} dict={dict} />
                </RevealOnScroll>
              )}
              {item1 && (
                <RevealOnScroll delayMs={100} className="flex-1">
                  <RecentArticleCard item={item1} lang={lang} variant="stacked" stackedStyle="background" showLabels={false} dict={dict} />
                </RevealOnScroll>
              )}
            </div>
          )}

          {item2 && (
            <RevealOnScroll delayMs={150} className="lg:col-span-8 h-full">
              <RecentArticleCard item={item2} lang={lang} variant="large" dict={dict} />
            </RevealOnScroll>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* ROW 2 (3 items): 3 TALL VERTICAL COLUMNS (4 cols + 4 cols + 4 cols) */}
      {/* ==================================================== */}
      {(item3 || item4 || item5) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {item3 && (
            <RevealOnScroll delayMs={200} className="lg:col-span-4 h-full">
              <RecentArticleCard item={item3} lang={lang} variant="tall" dict={dict} />
            </RevealOnScroll>
          )}

          {item4 && (
            <RevealOnScroll delayMs={250} className="lg:col-span-4 h-full">
              <RecentArticleCard item={item4} lang={lang} variant="tall" dict={dict} />
            </RevealOnScroll>
          )}

          {item5 && (
            <RevealOnScroll delayMs={300} className="md:col-span-2 lg:col-span-4 h-full">
              <RecentArticleCard item={item5} lang={lang} variant="tall" dict={dict} />
            </RevealOnScroll>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* ROW 3 (3 items): 1 LARGE (LEFT, 8 cols) + 2 STACKED (RIGHT, 4 cols) */}
      {/* ==================================================== */}
      {(item6 || item7 || item8) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {item6 && (
            <RevealOnScroll delayMs={350} className="lg:col-span-8 h-full">
              <RecentArticleCard item={item6} lang={lang} variant="large" dict={dict} />
            </RevealOnScroll>
          )}

          {(item7 || item8) && (
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-6 sm:gap-8 h-full justify-between">
              {item7 && (
                <RevealOnScroll delayMs={400} className="flex-1">
                  <RecentArticleCard item={item7} lang={lang} variant="stacked" stackedStyle="background" showLabels={false} dict={dict} />
                </RevealOnScroll>
              )}
              {item8 && (
                <RevealOnScroll delayMs={450} className="flex-1">
                  <RecentArticleCard item={item8} lang={lang} variant="stacked" stackedStyle="background" showLabels={false} dict={dict} />
                </RevealOnScroll>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
