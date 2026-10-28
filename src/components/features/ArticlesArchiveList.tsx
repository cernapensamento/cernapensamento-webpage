'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ArticleCard from '@/components/features/ArticleCard';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { PublicationCardItem, PublicationType } from '@/lib/db';
import { fetchMoreArticlesAction } from '@/actions/articles';

interface ArticlesArchiveListProps {
  initialArticles: PublicationCardItem[];
  lang: string;
  dict: {
    articles?: {
      noResults?: string;
      clearFilters?: string;
      loadMore?: string;
      loadingMore?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  filterOptions: {
    type?: PublicationType;
    tagSlugs?: string[];
    searchQuery?: string;
  };
}

export default function ArticlesArchiveList({
  initialArticles,
  lang,
  dict,
  filterOptions,
}: ArticlesArchiveListProps) {
  const [articles, setArticles] = useState<PublicationCardItem[]>(initialArticles);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(initialArticles.length > 10);

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-32 border-t border-lines">
        <p className="font-serif text-2xl text-charcoal/50 mb-6">{dict.articles?.noResults}</p>
        <Link
          href={`/${lang}/articulos`}
          className="group px-6 py-3 border border-charcoal text-xs font-sans uppercase tracking-[0.2em] text-charcoal hover:bg-charcoal hover:text-parchment transition-colors inline-flex items-center gap-2"
        >
          <span>{dict.articles?.clearFilters}</span>
          <span
            className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          >
            arrow_forward
          </span>
        </Link>
      </div>
    );
  }

  // Active articles shown cleanly in the main grid
  const visibleArticles = articles.slice(0, visibleCount);
  // Blurred teaser preview articles shown under the seam
  const previewArticles = hasMore ? articles.slice(visibleCount, visibleCount + 3) : [];

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const nextOffset = articles.length;
    const newVisibleCount = visibleCount + 10;
    setVisibleCount(newVisibleCount);

    try {
      const res = await fetchMoreArticlesAction({
        offset: nextOffset,
        limit: 10,
        type: filterOptions.type,
        tagSlugs: filterOptions.tagSlugs,
        searchQuery: filterOptions.searchQuery,
        lang,
      });

      if (res.success && res.publications.length > 0) {
        const nextCombined = [...articles, ...res.publications];
        setArticles(nextCombined);
        if (res.publications.length < 10 && nextCombined.length <= newVisibleCount) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more articles:', err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="w-full">
      {/* 1. Main Unblurred Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 border-t border-lines pt-16">
        {visibleArticles.map((publication, idx) => (
          <RevealOnScroll
            key={publication.id}
            delayMs={(idx % 3) * 80}
            className="h-full"
          >
            <ArticleCard articulo={publication} lang={lang} dict={dict} />
          </RevealOnScroll>
        ))}
      </div>

      {/* 2. Blurred Preview Row & Seam Load More Action */}
      {hasMore && previewArticles.length > 0 && (
        <div className="relative mt-12 pt-8 border-t border-lines/40 overflow-hidden">
          {/* Blurred Background Preview */}
          <div
            aria-hidden="true"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 filter blur-[6px] opacity-35 pointer-events-none select-none max-h-[290px] overflow-hidden transition-all duration-500"
          >
            {previewArticles.map((publication) => (
              <ArticleCard
                key={`preview-${publication.id}`}
                articulo={publication}
                lang={lang}
                dict={dict}
              />
            ))}
          </div>

          {/* Gradient Overlay & Centered Floating Button at the Seam */}
          <div className="absolute inset-0 bg-gradient-to-t from-parchment via-parchment/80 to-transparent flex flex-col items-center justify-center pb-4 z-20">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="group px-8 py-4 bg-charcoal text-parchment text-xs font-sans uppercase tracking-[0.2em] font-bold shadow-xl hover:bg-gold hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 cursor-pointer disabled:opacity-60"
            >
              <span>
                {isLoadingMore
                  ? (dict.articles?.loadingMore || 'Cargando...')
                  : (dict.articles?.loadMore || 'Cargar máis publicacións')}
              </span>
              <span
                className={`material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1 ${
                  isLoadingMore ? 'animate-spin' : ''
                }`}
                aria-hidden="true"
              >
                {isLoadingMore ? 'progress_activity' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
