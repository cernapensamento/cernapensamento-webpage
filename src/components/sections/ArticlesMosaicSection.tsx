import React from 'react';
import Link from 'next/link';
import { getDictionaryClient } from '@/dictionaries/client';
import ArticleCard, { type ArticleCardData } from '@/components/features/ArticleCard';
import RecentArticlesMosaicGrid from '@/components/features/RecentArticlesMosaicGrid';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { SectionArticleDict } from './sectionArticleHelpers';

export interface ArticlesMosaicDict extends SectionArticleDict {
  archiveTitle?: string;
  viewAll?: string;
}

interface ArticlesMosaicSectionProps {
  articulos: ArticleCardData[];
  pinnedArticulos?: ArticleCardData[];
  lang: string;
  dict?: ArticlesMosaicDict;
}

function EditorialDuoGrid({
  articles,
  lang,
  dict,
}: {
  articles: Array<ArticleCardData | undefined>;
  lang: string;
  dict?: ArticlesMosaicDict;
}) {
  const present = articles.filter((item): item is ArticleCardData => Boolean(item));
  if (present.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
      {present.map((article, idx) => (
        <RevealOnScroll key={article.id} delayMs={100 + idx * 100} className="h-full">
          <ArticleCard
            articulo={article}
            lang={lang}
            dict={dict}
            variant="auto"
            className="h-full"
          />
        </RevealOnScroll>
      ))}
    </div>
  );
}

export default function ArticlesMosaicSection({
  articulos,
  pinnedArticulos = [],
  lang,
  dict,
}: ArticlesMosaicSectionProps) {
  const fallbackDict = getDictionaryClient(lang);
  const mosaic = { ...fallbackDict.mosaic, ...dict?.mosaic };
  const archiveHeading =
    dict?.archiveTitle || dict?.articles?.title || fallbackDict.articles.title;
  const pinnedTitle = dict?.mosaic?.pinnedTitle || dict?.pinnedTitle || mosaic.pinnedTitle;
  const viewAllLabel = dict?.mosaic?.viewAll || dict?.viewAll || mosaic.viewAll;

  if (!articulos || articulos.length === 0) {
    return (
      <section className="w-full py-16 text-center">
        <p className="font-serif text-xl text-charcoal/60">
          {mosaic.noArticles}
        </p>
      </section>
    );
  }

  // Articles are already sorted by created_at DESC from DAL query
  const leadArticle = articulos[0];
  const level2Duo = [articulos[1], articulos[2]];
  const level3Duo = [articulos[3], articulos[4]];
  // Display 9 recent articles in an asymmetric editorial mosaic block
  const displayedRecentArticles = articulos.slice(5, 14);

  const pinnedGridCols =
    pinnedArticulos.length === 1
      ? 'grid-cols-1'
      : pinnedArticulos.length === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="w-full flex flex-col gap-14 md:gap-18">
      {/* Semantic H2 heading for articles section ensuring strictly sequential hierarchy */}
      <h2 className="sr-only">{archiveHeading}</h2>

      {/* MOSAIC LEVEL 1: HERO HORIZONTAL SPOTLIGHT (FULL WIDTH) */}
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

      {/* MOSAIC LEVEL 2: SECONDARY EDITORIAL DUO */}
      <EditorialDuoGrid articles={level2Duo} lang={lang} dict={dict} />

      {/* PINNED EDITORIAL ARTICLES */}
      {pinnedArticulos.length > 0 && (
        <div className="w-full flex flex-col gap-8 my-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-lines">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gold text-2xl" data-icon="push_pin">
                push_pin
              </span>
              <h3 className="font-serif text-2xl md:text-3xl text-charcoal font-semibold">
                {pinnedTitle}
              </h3>
            </div>
            <span className="text-[11px] sm:text-xs uppercase font-mono tracking-[0.16em] text-charcoal/40">
              {mosaic.pinnedSubtitle}
            </span>
          </div>

          <div className={`grid gap-8 ${pinnedGridCols}`}>
            {pinnedArticulos.map((pinned) => (
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

      {/* MOSAIC LEVEL 3: EDITORIAL DUO (Articles 4 & 5) */}
      <EditorialDuoGrid articles={level3Duo} lang={lang} dict={dict} />

      {/* MOSAIC LEVEL 4: 3-COLUMN EDITORIAL MOSAIC GRID (MAX 9 RECENT ARTICLES) */}
      {displayedRecentArticles.length > 0 && (
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between border-b border-lines pb-4">
            <h3 className="font-serif text-2xl md:text-3xl text-charcoal font-semibold">
              {mosaic.recentTitle}
            </h3>
            <Link
              href={`/${lang}/articulos`}
              className="text-xs font-bold uppercase tracking-[0.2em] text-gold hover:text-charcoal transition-colors flex items-center gap-1.5 group"
            >
              <span>{viewAllLabel}</span>
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

      {/* Explore Archive CTA button */}
      <RevealOnScroll delayMs={100} className="flex justify-center pt-8 pb-4">
        <Link
          href={`/${lang}/articulos`}
          className="inline-flex items-center justify-center gap-3.5 px-8 sm:px-12 py-4 sm:py-5 border-2 border-charcoal text-xs sm:text-sm font-bold uppercase tracking-[0.22em] text-charcoal bg-transparent hover:bg-charcoal hover:text-parchment dark:hover:text-parchment transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
        >
          <span>{mosaic.exploreAll}</span>
          <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1 text-gold" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
      </RevealOnScroll>
    </section>
  );
}
