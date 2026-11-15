'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { ArticleCardData } from '@/components/features/ArticleCard';
import FormattedDate from '@/components/ui/FormattedDate';
import { getDictionaryClient } from '@/dictionaries/client';
import {
  resolvePublicationAuthor,
  resolvePublicationCover,
  resolvePublicationDate,
  resolvePublicationHref,
  resolvePublicationLabels,
  resolvePublicationSubtitle,
  resolvePublicationTitle,
} from './publicationCardHelpers';
import { MosaicCoverBackdrop, TopGoldHoverLine } from './MosaicPrimitives';

interface RecentArticlesMosaicGridProps {
  articulos: ArticleCardData[];
  lang: string;
  dict?: {
    documentTypes?: Record<string, string>;
    readArticle?: string;
    articles?: {
      by?: string;
      readArticle?: string;
      [key: string]: unknown;
    };
    mosaic?: {
      readArticle?: string;
      by?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

interface RecentArticleCardProps {
  item: ArticleCardData;
  lang: string;
  variant: 'large' | 'stacked' | 'tall';
  stackedStyle?: 'side' | 'background';
  showLabels?: boolean;
  dict?: RecentArticlesMosaicGridProps['dict'];
}

function RecentArticleCard({
  item,
  lang,
  variant,
  stackedStyle = 'side',
  showLabels = true,
  dict,
}: RecentArticleCardProps) {
  const fallbackDict = getDictionaryClient(lang);
  const title = resolvePublicationTitle(item, lang);
  const subtitle = resolvePublicationSubtitle(item, lang);
  const labels = resolvePublicationLabels(item, {
    documentTypes: dict?.documentTypes,
    fallbackDict,
  });
  const rawDate = resolvePublicationDate(item);
  const coverUrl = resolvePublicationCover(item);
  const hasCover = Boolean(coverUrl);
  const { name: authorName } = resolvePublicationAuthor(item, '');
  const byLabel = dict?.mosaic?.by || dict?.articles?.by || fallbackDict.mosaic.by;
  const readLabel = dict?.mosaic?.readArticle || dict?.articles?.readArticle || dict?.readArticle || fallbackDict.mosaic.readArticle;
  const href = resolvePublicationHref(item, lang);

  if (variant === 'large') {
    return (
      <Link
        href={href}
        className="group relative flex flex-col justify-end p-7 sm:p-10 border border-lines bg-parchment overflow-hidden transition-all duration-300 hover:border-gold/60 hover:shadow-xl h-full min-h-[360px] sm:min-h-[440px]"
      >
        <TopGoldHoverLine />

        {coverUrl ? (
          <MosaicCoverBackdrop
            src={coverUrl}
            alt={title}
            sizes="(max-width: 1024px) 100vw, 65vw"
            gradientToClass="dark:to-black/30"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute -right-4 -bottom-8 text-[180px] font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
          >
            §
          </span>
        )}

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
              {authorName ? `${byLabel} ${authorName}` : ''}
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
        <TopGoldHoverLine />

        <div className="flex flex-col gap-3">
          {coverUrl && (
            <div className="w-full aspect-[16/10] relative overflow-hidden bg-lines/30 mb-2 shrink-0 border border-lines/40">
              <Image
                src={coverUrl}
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

  // STACKED VARIANT - OPTION A: IMAGE ON BACKGROUND
  if (variant === 'stacked' && stackedStyle === 'background') {
    return (
      <Link
        href={href}
        className="group relative flex flex-col justify-between p-5 sm:p-6 border border-lines bg-parchment overflow-hidden transition-all duration-300 hover:border-gold/60 hover:shadow-xl h-full min-h-[175px]"
      >
        <TopGoldHoverLine />

        {coverUrl ? (
          <MosaicCoverBackdrop
            src={coverUrl}
            alt={title}
            sizes="(max-width: 1024px) 100vw, 33vw"
            gradientToClass="dark:to-black/30"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute -right-3 -bottom-6 text-8xl font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
          >
            §
          </span>
        )}

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

  // STACKED VARIANT - OPTION B: SIDE THUMBNAIL (STANDARD)
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between p-5 sm:p-6 border border-lines bg-parchment overflow-hidden transition-all duration-300 hover:border-gold/60 hover:shadow-md h-full min-h-[175px]"
    >
      <TopGoldHoverLine />

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

        {coverUrl && (
          <div className="w-20 sm:w-24 relative overflow-hidden shrink-0 border border-lines/40 aspect-square sm:aspect-auto">
            <Image
              src={coverUrl}
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

function StackedRecentPair({
  first,
  second,
  firstDelayMs,
  secondDelayMs,
  lang,
  dict,
}: {
  first?: ArticleCardData;
  second?: ArticleCardData;
  firstDelayMs: number;
  secondDelayMs: number;
  lang: string;
  dict?: RecentArticlesMosaicGridProps['dict'];
}) {
  if (!first && !second) return null;

  return (
    <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-6 sm:gap-8 h-full justify-between">
      {first && (
        <RevealOnScroll delayMs={firstDelayMs} className="flex-1">
          <RecentArticleCard item={first} lang={lang} variant="stacked" stackedStyle="background" showLabels={false} dict={dict} />
        </RevealOnScroll>
      )}
      {second && (
        <RevealOnScroll delayMs={secondDelayMs} className="flex-1">
          <RecentArticleCard item={second} lang={lang} variant="stacked" stackedStyle="background" showLabels={false} dict={dict} />
        </RevealOnScroll>
      )}
    </div>
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

  const [item0, item1, item2, item3, item4, item5, item6, item7, item8] = articulos;

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8">
      {/* ROW 1 (3 items): 2 STACKED (LEFT, 4 cols) + 1 LARGE (RIGHT, 8 cols) */}
      {(item0 || item1 || item2) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          <StackedRecentPair
            first={item0}
            second={item1}
            firstDelayMs={50}
            secondDelayMs={100}
            lang={lang}
            dict={dict}
          />

          {item2 && (
            <RevealOnScroll delayMs={150} className="lg:col-span-8 h-full">
              <RecentArticleCard item={item2} lang={lang} variant="large" dict={dict} />
            </RevealOnScroll>
          )}
        </div>
      )}

      {/* ROW 2 (3 items): 3 TALL VERTICAL COLUMNS (4 cols + 4 cols + 4 cols) */}
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

      {/* ROW 3 (3 items): 1 LARGE (LEFT, 8 cols) + 2 STACKED (RIGHT, 4 cols) */}
      {(item6 || item7 || item8) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {item6 && (
            <RevealOnScroll delayMs={350} className="lg:col-span-8 h-full">
              <RecentArticleCard item={item6} lang={lang} variant="large" dict={dict} />
            </RevealOnScroll>
          )}

          <StackedRecentPair
            first={item7}
            second={item8}
            firstDelayMs={400}
            secondDelayMs={450}
            lang={lang}
            dict={dict}
          />
        </div>
      )}
    </div>
  );
}
