'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { PublicationCardItem } from '@/lib/db';
import { PUBLICATION_TYPES } from '@/lib/db/schema';
import FormattedDate from '@/components/ui/FormattedDate';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

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

function getLocalizedCategory(
  item: PublicationCardItem,
  lang: string,
  documentTypes?: Record<string, string>
): string {
  // 1. Prefer localized tag if available
  if (item.tags && item.tags.length > 0) {
    const firstTag = item.tags[0];
    if (firstTag.name && firstTag.name.toLowerCase() !== PUBLICATION_TYPES.NEWS && firstTag.name.toLowerCase() !== PUBLICATION_TYPES.ARTICLE) {
      return firstTag.name.toUpperCase();
    }
  }

  // 2. Localized publication category from dictionary
  if (documentTypes && item.type && documentTypes[item.type]) {
    return documentTypes[item.type].toUpperCase();
  }

  const fallbackDict = lang === 'es' ? esDict : glDict;
  return (documentTypes?.[PUBLICATION_TYPES.NEWS] || fallbackDict.documentTypes[PUBLICATION_TYPES.NEWS]).toUpperCase();
}

interface NewsCardProps {
  item: PublicationCardItem;
  lang: string;
  variant: 'large' | 'stacked' | 'tall';
  theme: 'dark' | 'light' | 'charcoal';
  dict?: NewsMosaicGridProps['dict'];
}

function NewsCard({ item, lang, variant, theme, dict }: NewsCardProps) {
  const title =
    (item.title as Record<string, string>)?.[lang] ||
    (item.title as Record<string, string>)?.gl ||
    (item.title as Record<string, string>)?.es ||
    '';
  const subtitle =
    (item.subtitle as Record<string, string>)?.[lang] ||
    (item.subtitle as Record<string, string>)?.gl ||
    (item.subtitle as Record<string, string>)?.es ||
    '';
  const category = getLocalizedCategory(item, lang, dict?.documentTypes);
  const rawDate = item.created_at;
  const hasCover = Boolean(item.cover_image_url);
  const byLabel = dict?.articles?.by || 'Por';

  // Theme-adaptive styling with full light and dark mode parity
  const bgClass =
    theme === 'charcoal'
      ? 'bg-parchment dark:bg-[#141414] border border-lines dark:border-white/10'
      : theme === 'dark'
        ? 'bg-surface dark:bg-[#1a1a1a] border border-lines dark:border-white/10'
        : 'bg-surface dark:bg-[#202020] border border-lines dark:border-white/10';

  const textHeadingClass = 'text-charcoal dark:text-[#f3f1ee] group-hover:text-gold dark:group-hover:text-gold transition-colors';
  const textMutedClass = 'text-charcoal/70 dark:text-[#c4c1ba]';
  const textAuthorClass = 'text-charcoal/60 dark:text-[#9e9b94]';

  if (variant === 'large') {
    return (
      <Link
        href={`/${lang}/articulo/${item.slug}`}
        className={`group relative flex flex-col justify-end p-7 sm:p-10 overflow-hidden transition-all duration-300 hover:border-gold hover:shadow-xl dark:hover:border-gold/60 h-full min-h-[340px] sm:min-h-[420px] ${bgClass}`}
      >
        {/* Cover image if available */}
        {hasCover && (
          <>
            <Image
              src={item.cover_image_url as string}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Adaptive protective gradient: light mode parchment tone, dark mode deep charcoal */}
            <div className="absolute inset-0 bg-gradient-to-t from-parchment via-parchment/85 to-parchment/20 dark:from-black/95 dark:via-black/75 dark:to-black/25 transition-colors duration-300" />
          </>
        )}

        <span
          aria-hidden="true"
          className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
        />

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
        href={`/${lang}/articulo/${item.slug}`}
        className={`group relative flex flex-col justify-between p-6 sm:p-7 overflow-hidden transition-all duration-300 hover:border-gold hover:shadow-lg dark:hover:border-gold/60 h-full min-h-[300px] ${bgClass}`}
      >
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
        />

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
      href={`/${lang}/articulo/${item.slug}`}
      className={`group relative flex flex-col justify-between p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:border-gold hover:shadow-md dark:hover:border-gold/60 h-full min-h-[170px] ${bgClass}`}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
      />

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

export default function NewsMosaicGrid({ news, lang, dict }: NewsMosaicGridProps) {
  const d = dict || (lang === 'gl' ? glDict : esDict);
  if (!news || news.length === 0) {
    return (
      <div className="text-center py-24 sm:py-32 border-t border-lines">
        <span className="material-symbols-outlined text-4xl text-gold/60 mb-4" aria-hidden="true">
          newspaper
        </span>
        <p className="font-serif text-2xl text-charcoal/60 mb-6">
          {d.noticias?.emptyMessage}
        </p>
        <Link
          href={`/${lang}/articulos`}
          className="group px-6 py-3 border border-charcoal text-xs font-sans uppercase tracking-[0.2em] text-charcoal hover:bg-charcoal hover:text-parchment transition-colors inline-flex items-center gap-2"
        >
          <span>
            {d.noticias?.exploreButton}
          </span>
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

        // Block elements
        const item0 = block[0];
        const item1 = block[1];
        const item2 = block[2];
        const item3 = block[3];
        const item4 = block[4];
        const item5 = block[5];
        const item6 = block[6];

        if (!isAlternate) {
          // Standard Block Pattern (Left panel in reference diagram):
          // Top: Large (left, 8 cols) + 2 Stacked (right, 4 cols)
          // Bottom: Tall (left, 4 cols) + 2 Stacked (center, 4 cols) + Tall (right, 4 cols)
          return (
            <div key={`block-${blockIndex}`} className="flex flex-col gap-6 sm:gap-8">
              {/* Top Row: Large + 2 Stacked */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
                {item0 && (
                  <RevealOnScroll delayMs={50} className="lg:col-span-8 h-full">
                    <NewsCard item={item0} lang={lang} variant="large" theme="charcoal" dict={d} />
                  </RevealOnScroll>
                )}

                {(item1 || item2) && (
                  <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 h-full justify-between">
                    {item1 && (
                      <RevealOnScroll delayMs={100} className="flex-1">
                        <NewsCard item={item1} lang={lang} variant="stacked" theme="dark" dict={d} />
                      </RevealOnScroll>
                    )}
                    {item2 && (
                      <RevealOnScroll delayMs={150} className="flex-1">
                        <NewsCard item={item2} lang={lang} variant="stacked" theme="light" dict={d} />
                      </RevealOnScroll>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Row: 3 Columns (Tall, 2-Stacked, Tall) */}
              {(item3 || item4 || item5 || item6) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
                  {item3 && (
                    <RevealOnScroll delayMs={200} className="lg:col-span-4 h-full">
                      <NewsCard item={item3} lang={lang} variant="tall" theme="light" dict={d} />
                    </RevealOnScroll>
                  )}

                  {(item4 || item5) && (
                    <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 h-full justify-between">
                      {item4 && (
                        <RevealOnScroll delayMs={250} className="flex-1">
                          <NewsCard item={item4} lang={lang} variant="stacked" theme="dark" dict={d} />
                        </RevealOnScroll>
                      )}
                      {item5 && (
                        <RevealOnScroll delayMs={300} className="flex-1">
                          <NewsCard item={item5} lang={lang} variant="stacked" theme="light" dict={d} />
                        </RevealOnScroll>
                      )}
                    </div>
                  )}

                  {item6 && (
                    <RevealOnScroll delayMs={350} className="lg:col-span-4 h-full">
                      <NewsCard item={item6} lang={lang} variant="tall" theme="light" dict={d} />
                    </RevealOnScroll>
                  )}
                </div>
              )}
            </div>
          );
        } else {
          // Inverted / Variation Block Pattern (Right panel in reference diagram):
          // Top: Large (left, 8 cols) + 2 Stacked (right, 4 cols)
          // Bottom: 2 Stacked (left, 4 cols) + Large (right, 8 cols)
          return (
            <div key={`block-${blockIndex}`} className="flex flex-col gap-6 sm:gap-8">
              {/* Top Row: Large + 2 Stacked */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
                {item0 && (
                  <RevealOnScroll delayMs={50} className="lg:col-span-8 h-full">
                    <NewsCard item={item0} lang={lang} variant="large" theme="charcoal" dict={d} />
                  </RevealOnScroll>
                )}

                {(item1 || item2) && (
                  <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 h-full justify-between">
                    {item1 && (
                      <RevealOnScroll delayMs={100} className="flex-1">
                        <NewsCard item={item1} lang={lang} variant="stacked" theme="dark" dict={d} />
                      </RevealOnScroll>
                    )}
                    {item2 && (
                      <RevealOnScroll delayMs={150} className="flex-1">
                        <NewsCard item={item2} lang={lang} variant="stacked" theme="light" dict={d} />
                      </RevealOnScroll>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Row: 2-Stacked (Left, 4 cols) + Large (Right, 8 cols) */}
              {(item3 || item4 || item5) && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
                  <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 h-full justify-between">
                    {item3 && (
                      <RevealOnScroll delayMs={200} className="flex-1">
                        <NewsCard item={item3} lang={lang} variant="stacked" theme="light" dict={d} />
                      </RevealOnScroll>
                    )}
                    {item4 && (
                      <RevealOnScroll delayMs={250} className="flex-1">
                        <NewsCard item={item4} lang={lang} variant="stacked" theme="dark" dict={d} />
                      </RevealOnScroll>
                    )}
                  </div>

                  {item5 && (
                    <RevealOnScroll delayMs={300} className="lg:col-span-8 h-full">
                      <NewsCard item={item5} lang={lang} variant="large" theme="charcoal" dict={d} />
                    </RevealOnScroll>
                  )}
                </div>
              )}
            </div>
          );
        }
      })}
    </div>
  );
}
