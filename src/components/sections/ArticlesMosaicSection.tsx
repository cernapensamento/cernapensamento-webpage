import React from 'react';
import Link from 'next/link';
import ArticleCard, { type ArticleCardData } from '@/components/features/ArticleCard';
import RecentArticlesMosaicGrid from '@/components/features/RecentArticlesMosaicGrid';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

interface ArticlesMosaicSectionProps {
  articulos: ArticleCardData[];
  pinnedArticulos?: ArticleCardData[];
  lang: string;
  dict?: {
    documentTypes?: Record<string, string>;
    readArticle?: string;
    archiveTitle?: string;
    viewAll?: string;
    pinnedTitle?: string;
    mosaic?: {
      noArticles?: string;
      pinnedTitle?: string;
      pinnedSubtitle?: string;
      recentTitle?: string;
      viewAll?: string;
      exploreAll?: string;
      readArticle?: string;
      by?: string;
    };
    [key: string]: unknown;
  };
}

export default function ArticlesMosaicSection({
  articulos,
  pinnedArticulos = [],
  lang,
  dict,
}: ArticlesMosaicSectionProps) {
  if (!articulos || articulos.length === 0) {
    return (
      <section className="w-full py-16 text-center">
        <p className="font-serif text-xl text-charcoal/60">
          {dict?.mosaic?.noArticles}
        </p>
      </section>
    );
  }

  // Articles are already sorted by created_at DESC from DAL query
  const leadArticle = articulos[0];
  const secondArticle = articulos[1];
  const thirdArticle = articulos[2];
  const fourthArticle = articulos[3];
  const fifthArticle = articulos[4];
  // Display 9 recent articles in an asymmetric editorial mosaic block
  const displayedRecentArticles = articulos.slice(5, 14);

  const pinnedItems = pinnedArticulos;

  return (
    <section className="w-full flex flex-col gap-14 md:gap-18">
      {/* Semantic H2 heading for articles section ensuring strictly sequential hierarchy */}
      <h2 className="sr-only">
        {dict?.mosaic?.pinnedTitle || dict?.pinnedTitle || dict?.archiveTitle || 'Publicacións Destacadas'}
      </h2>
      
      {/* ==================================================== */}
      {/* MOSAIC LEVEL 1: HERO HORIZONTAL SPOTLIGHT (FULL WIDTH) */}
      {/* ==================================================== */}
      {leadArticle && (
        <RevealOnScroll className="w-full" delayMs={50}>
          <ArticleCard
            articulo={leadArticle}
            lang={lang}
            dict={dict}
            variant="lead"
            priority={true}
            className="w-full"
          />
        </RevealOnScroll>
      )}

      {/* ==================================================== */}
      {/* MOSAIC LEVEL 2: SECONDARY EDITORIAL DUO */}
      {/* ==================================================== */}
      {(secondArticle || thirdArticle) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {secondArticle && (
            <RevealOnScroll className="h-full" delayMs={100}>
              <ArticleCard
                articulo={secondArticle}
                lang={lang}
                dict={dict}
                variant="auto"
                className="h-full"
              />
            </RevealOnScroll>
          )}

          {thirdArticle && (
            <RevealOnScroll className="h-full" delayMs={200}>
              <ArticleCard
                articulo={thirdArticle}
                lang={lang}
                dict={dict}
                variant="auto"
                className="h-full"
              />
            </RevealOnScroll>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* PINNED EDITORIAL ARTICLES (FREE CARDS WITH GREY BACKGROUND) */}
      {/* ==================================================== */}
      {pinnedItems.length > 0 && (
        <div className="w-full flex flex-col gap-8 my-2">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-lines">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gold text-2xl" data-icon="push_pin">
                push_pin
              </span>
              <h2 className="font-serif text-2xl md:text-3xl text-charcoal font-semibold">
                {dict?.mosaic?.pinnedTitle}
              </h2>
            </div>
            <span className="text-[11px] sm:text-xs uppercase font-mono tracking-[0.16em] text-charcoal/40">
              {dict?.mosaic?.pinnedSubtitle}
            </span>
          </div>

          {/* Individual Pinned Cards (Free, each with grey background bg-surface) */}
          <div className={`grid gap-8 ${
            pinnedItems.length === 1
              ? 'grid-cols-1'
              : pinnedItems.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {pinnedItems.map((pinned) => (
              <RevealOnScroll key={pinned.id} delayMs={100} className="h-full">
                <ArticleCard
                  articulo={pinned}
                  lang={lang}
                  dict={dict}
                  variant="pinned"
                  className="h-full bg-transparent border border-lines p-6 sm:p-8 hover:border-gold/60 transition-all duration-300"
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MOSAIC LEVEL 3: EDITORIAL DUO (Articles 4 & 5) */}
      {/* ==================================================== */}
      {(fourthArticle || fifthArticle) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {fourthArticle && (
            <RevealOnScroll delayMs={100} className="h-full">
              <ArticleCard
                articulo={fourthArticle}
                lang={lang}
                dict={dict}
                variant="auto"
                className="h-full"
              />
            </RevealOnScroll>
          )}

          {fifthArticle && (
            <RevealOnScroll delayMs={200} className="h-full">
              <ArticleCard
                articulo={fifthArticle}
                lang={lang}
                dict={dict}
                variant="auto"
                className="h-full"
              />
            </RevealOnScroll>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MOSAIC LEVEL 4: 3-COLUMN EDITORIAL MOSAIC GRID (MAX 9 RECENT ARTICLES) */}
      {/* ==================================================== */}
      {displayedRecentArticles.length > 0 && (
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between border-b border-lines pb-4">
            <h2 className="font-serif text-2xl md:text-3xl text-charcoal font-semibold">
              {dict?.mosaic?.recentTitle}
            </h2>
            <Link
              href={`/${lang}/articulos`}
              className="text-xs font-bold uppercase tracking-[0.2em] text-gold hover:text-charcoal transition-colors flex items-center gap-1.5 group"
            >
              <span>{dict?.mosaic?.viewAll}</span>
              <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>

          <RecentArticlesMosaicGrid
            articulos={displayedRecentArticles}
            lang={lang}
            dict={dict}
          />
        </div>
      )}

      {/* Explore Archive CTA button — Prominent & Editorial */}
      <RevealOnScroll delayMs={100} className="flex justify-center pt-8 pb-4">
        <Link
          href={`/${lang}/articulos`}
          className="inline-flex items-center justify-center gap-3.5 px-8 sm:px-12 py-4 sm:py-5 border-2 border-charcoal text-xs sm:text-sm font-bold uppercase tracking-[0.22em] text-charcoal bg-transparent hover:bg-charcoal hover:text-parchment dark:hover:text-parchment transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
        >
          <span>{dict?.mosaic?.exploreAll}</span>
          <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1 text-gold" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
      </RevealOnScroll>
    </section>
  );
}
