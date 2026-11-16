'use client';

import React from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { PUBLICATION_TYPES } from '@/lib/db/schema';
import type { PublicationCardItem } from '@/lib/db/types';
import FormattedDate from '@/components/ui/FormattedDate';
import { getDictionaryClient } from '@/dictionaries/client';
import {
  resolvePublicationCover,
  resolvePublicationDate,
  resolvePublicationHref,
  resolvePublicationLabels,
  resolvePublicationSubtitle,
  resolvePublicationTitle,
} from './publicationCardHelpers';
import { MosaicCoverBackdrop, TopGoldHoverLine } from './MosaicPrimitives';

interface NewsMosaicGridProps {
  news: PublicationCardItem[];
  lang: string;
  dict?: {
    noticias?: {
      emptyMessage?: string;
      exploreButton?: string;
      [key: string]: unknown;
    };
    articles?: {
      by?: string;
      [key: string]: unknown;
    };
    documentTypes?: Record<string, string>;
    [key: string]: unknown;
  };
}

interface NewsCardProps {
  item: PublicationCardItem;
  lang: string;
  variant: 'large' | 'stacked' | 'tall';
  theme: 'dark' | 'light' | 'charcoal';
  dict?: NewsMosaicGridProps['dict'];
}

const THEME_BG_CLASSES: Record<NewsCardProps['theme'], string> = {
  charcoal: 'bg-parchment dark:bg-[#141414] border border-lines dark:border-white/10',
  dark: 'bg-surface dark:bg-[#1a1a1a] border border-lines dark:border-white/10',
  light: 'bg-surface dark:bg-[#202020] border border-lines dark:border-white/10',
};

function NewsCard({ item, lang, variant, theme, dict }: NewsCardProps) {
  const fallbackDict = getDictionaryClient(lang);
  const title = resolvePublicationTitle(item, lang);
  const subtitle = resolvePublicationSubtitle(item, lang);
  const [category] = resolvePublicationLabels(item, {
    documentTypes: dict?.documentTypes,
    fallbackDict,
    defaultType: PUBLICATION_TYPES.NEWS,
    maxTags: 1,
  });
  const rawDate = resolvePublicationDate(item);
  const coverUrl = resolvePublicationCover(item);
  const hasCover = Boolean(coverUrl);
  const byLabel = dict?.articles?.by || fallbackDict.articles.by;
  const href = resolvePublicationHref(item, lang);

  const bgClass = THEME_BG_CLASSES[theme];
  const textHeadingClass = 'text-charcoal dark:text-[#f3f1ee] group-hover:text-gold dark:group-hover:text-gold transition-colors';
  const textMutedClass = 'text-charcoal/70 dark:text-[#c4c1ba]';
  const textAuthorClass = 'text-charcoal/60 dark:text-[#9e9b94]';

  if (variant === 'large') {
    return (
      <Link
        href={href}
        className={`group relative flex flex-col justify-end p-7 sm:p-10 overflow-hidden transition-all duration-300 hover:border-gold hover:shadow-xl dark:hover:border-gold/60 h-full min-h-[340px] sm:min-h-[420px] ${bgClass}`}
      >
        {coverUrl && (
          <MosaicCoverBackdrop
            src={coverUrl}
            alt={title}
            sizes="(max-width: 1024px) 100vw, 65vw"
          />
        )}

        <TopGoldHoverLine />

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 border ${
                hasCover
                  ? 'bg-parchment/90 dark:bg-black/60 backdrop-blur-sm border-lines dark:border-white/20 text-charcoal/90 dark:text-[#e0deda]'
                  : 'bg-surface dark:bg-white/[0.04] border-lines dark:border-white/15 text-charcoal/80 dark:text-[#c4c1ba]'
              }`}
            >
              {category}
            </span>
            <FormattedDate
              date={rawDate}
              lang={lang}
              format="short"
              className={`font-mono text-[11px] uppercase tracking-wider ${hasCover ? 'text-charcoal/70 dark:text-white/80' : textAuthorClass}`}
            />
          </div>

          <h2 className={`font-serif text-2xl sm:text-3xl md:text-4xl font-bold leading-tight group-hover:text-gold transition-colors line-clamp-3 ${hasCover ? 'text-charcoal dark:text-white' : textHeadingClass}`}>
            {title}
          </h2>

          {subtitle && (
            <p className={`font-sans text-xs sm:text-sm line-clamp-2 leading-relaxed max-w-2xl ${hasCover ? 'text-charcoal/80 dark:text-white/80' : textMutedClass}`}>
              {subtitle}
            </p>
          )}

          <div className={`mt-2 pt-3 border-t flex items-center justify-between ${hasCover ? 'border-lines dark:border-white/20' : 'border-lines/40 dark:border-white/10'}`}>
            <span className={`font-sans text-xs ${hasCover ? 'text-charcoal/70 dark:text-white/70' : textAuthorClass}`}>
              {item.author?.full_name ? `${byLabel} ${item.author.full_name}` : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-[0.16em] text-gold">
              <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
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
        className={`group relative flex flex-col justify-between p-6 sm:p-7 overflow-hidden transition-all duration-300 hover:border-gold hover:shadow-lg dark:hover:border-gold/60 h-full min-h-[300px] ${bgClass}`}
      >
        <TopGoldHoverLine />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal/80 dark:text-[#c4c1ba] bg-surface dark:bg-white/[0.04] border border-lines dark:border-white/15 px-2.5 py-1">
              {category}
            </span>
            <FormattedDate
              date={rawDate}
              lang={lang}
              format="short"
              className={`font-mono text-[10px] uppercase tracking-wider ${textAuthorClass}`}
            />
          </div>

          <h3 className={`font-serif text-xl sm:text-2xl font-bold leading-snug ${textHeadingClass}`}>
            {title}
          </h3>

          {subtitle && (
            <p className={`font-sans text-xs leading-relaxed line-clamp-3 ${textMutedClass}`}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="pt-4 mt-6 border-t border-lines/40 dark:border-white/10 flex items-center justify-between">
          <span className={`font-sans text-[11px] truncate ${textAuthorClass}`}>
            {item.author?.full_name || ''}
          </span>
          <span className="material-symbols-outlined text-base text-gold transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
            arrow_forward
          </span>
        </div>
      </Link>
    );
  }

  // Default 'stacked' (compact/square)
  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:border-gold hover:shadow-md dark:hover:border-gold/60 h-full min-h-[170px] ${bgClass}`}
    >
      <TopGoldHoverLine />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-charcoal/80 dark:text-[#c4c1ba] bg-surface dark:bg-white/[0.04] border border-lines dark:border-white/15 px-2 py-0.5">
            {category}
          </span>
          <FormattedDate
            date={rawDate}
            lang={lang}
            format="short"
            className={`font-mono text-[10px] uppercase tracking-wider ${textAuthorClass}`}
          />
        </div>

        <h3 className={`font-serif text-base sm:text-lg font-bold leading-snug line-clamp-2 ${textHeadingClass}`}>
          {title}
        </h3>
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] border-t border-lines/40 dark:border-white/10 mt-3">
        <span className={`font-sans truncate ${textAuthorClass}`}>
          {item.author?.full_name || ''}
        </span>
        <span className="material-symbols-outlined text-base text-gold transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

function StackedNewsPair({
  first,
  second,
  firstTheme,
  secondTheme,
  firstDelayMs,
  secondDelayMs,
  lang,
  dict,
}: {
  first?: PublicationCardItem;
  second?: PublicationCardItem;
  firstTheme: NewsCardProps['theme'];
  secondTheme: NewsCardProps['theme'];
  firstDelayMs: number;
  secondDelayMs: number;
  lang: string;
  dict: NewsMosaicGridProps['dict'];
}) {
  if (!first && !second) return null;

  return (
    <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 h-full justify-between">
      {first && (
        <RevealOnScroll delayMs={firstDelayMs} className="flex-1">
          <NewsCard item={first} lang={lang} variant="stacked" theme={firstTheme} dict={dict} />
        </RevealOnScroll>
      )}
      {second && (
        <RevealOnScroll delayMs={secondDelayMs} className="flex-1">
          <NewsCard item={second} lang={lang} variant="stacked" theme={secondTheme} dict={dict} />
        </RevealOnScroll>
      )}
    </div>
  );
}

export default function NewsMosaicGrid({ news, lang, dict }: NewsMosaicGridProps) {
  const fallbackDict = getDictionaryClient(lang);
  const noticiasDict = {
    ...fallbackDict.noticias,
    ...dict?.noticias,
  };
  const resolvedDict = dict ?? fallbackDict;

  if (!news || news.length === 0) {
    return (
      <div className="text-center py-24 sm:py-32 border-t border-lines">
        <span className="material-symbols-outlined text-4xl text-gold/60 mb-4" aria-hidden="true">
          newspaper
        </span>
        <p className="font-serif text-2xl text-charcoal/60 mb-6">
          {noticiasDict.emptyMessage}
        </p>
        <Link
          href={`/${lang}/articulos`}
          className="group px-6 py-3 border border-charcoal text-xs font-sans uppercase tracking-[0.2em] text-charcoal hover:bg-charcoal hover:text-parchment transition-colors inline-flex items-center gap-2"
        >
          <span>{noticiasDict.exploreButton}</span>
          <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
      </div>
    );
  }

  // Partition news into recurring 7-item blueprint blocks based on the architectural diagram
  const blocks: PublicationCardItem[][] = [];
  for (let i = 0; i < news.length; i += 7) {
    blocks.push(news.slice(i, i + 7));
  }

  return (
    <div className="w-full flex flex-col gap-12 sm:gap-16">
      {blocks.map((block, blockIndex) => {
        const isAlternate = blockIndex % 2 === 1;
        const [item0, item1, item2, item3, item4, item5, item6] = block;
        const hasBottomRow = Boolean(item3 || item4 || item5 || item6);

        return (
          <div key={`block-${blockIndex}`} className="flex flex-col gap-6 sm:gap-8">
            {/* Top Row: Large (left, 8 cols) + 2 Stacked (right, 4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
              {item0 && (
                <RevealOnScroll delayMs={50} className="lg:col-span-8 h-full">
                  <NewsCard item={item0} lang={lang} variant="large" theme="charcoal" dict={resolvedDict} />
                </RevealOnScroll>
              )}

              <StackedNewsPair
                first={item1}
                second={item2}
                firstTheme="dark"
                secondTheme="light"
                firstDelayMs={100}
                secondDelayMs={150}
                lang={lang}
                dict={resolvedDict}
              />
            </div>

            {/* Bottom Row: Standard (Tall + 2 Stacked + Tall) or Alternate (2 Stacked + Large/Tall + Tall) */}
            {hasBottomRow && !isAlternate && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
                {item3 && (
                  <RevealOnScroll delayMs={200} className="lg:col-span-4 h-full">
                    <NewsCard item={item3} lang={lang} variant="tall" theme="light" dict={resolvedDict} />
                  </RevealOnScroll>
                )}

                <StackedNewsPair
                  first={item4}
                  second={item5}
                  firstTheme="dark"
                  secondTheme="light"
                  firstDelayMs={250}
                  secondDelayMs={300}
                  lang={lang}
                  dict={resolvedDict}
                />

                {item6 && (
                  <RevealOnScroll delayMs={350} className="lg:col-span-4 h-full">
                    <NewsCard item={item6} lang={lang} variant="tall" theme="light" dict={resolvedDict} />
                  </RevealOnScroll>
                )}
              </div>
            )}

            {hasBottomRow && isAlternate && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
                <StackedNewsPair
                  first={item3}
                  second={item4}
                  firstTheme="light"
                  secondTheme="dark"
                  firstDelayMs={200}
                  secondDelayMs={250}
                  lang={lang}
                  dict={resolvedDict}
                />

                {item5 && (
                  <RevealOnScroll delayMs={300} className={item6 ? 'lg:col-span-4 h-full' : 'lg:col-span-8 h-full'}>
                    <NewsCard
                      item={item5}
                      lang={lang}
                      variant={item6 ? 'tall' : 'large'}
                      theme="charcoal"
                      dict={resolvedDict}
                    />
                  </RevealOnScroll>
                )}

                {item6 && (
                  <RevealOnScroll delayMs={350} className="lg:col-span-4 h-full">
                    <NewsCard item={item6} lang={lang} variant="tall" theme="light" dict={resolvedDict} />
                  </RevealOnScroll>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
