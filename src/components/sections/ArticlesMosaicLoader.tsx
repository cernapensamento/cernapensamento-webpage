import React from 'react';
import { getPublicationCards, getPinnedPublications } from '@/lib/db';
import ArticlesMosaicSection from './ArticlesMosaicSection';

interface ArticlesMosaicLoaderProps {
  lang: string;
  dict: {
    documentTypes?: Record<string, string>;
    readArticle?: string;
    [key: string]: unknown;
  };
}

export default async function ArticlesMosaicLoader({
  lang,
  dict,
}: ArticlesMosaicLoaderProps) {
  // 1. Explicitly fetch ALL pinned publications so they are guaranteed to appear on the layout
  // 2. Fetch the most recent publications sorted by publication date
  const [pinnedArticles, allArticles] = await Promise.all([
    getPinnedPublications(20, undefined, lang),
    getPublicationCards({
      limit: 24,
      lang,
    }),
  ]);

  const pinnedIds = new Set(pinnedArticles.map((p) => p.id));
  const regularArticles = allArticles.filter((a) => !pinnedIds.has(a.id));

  return (
    <ArticlesMosaicSection
      articulos={regularArticles}
      pinnedArticulos={pinnedArticles}
      lang={lang}
      dict={dict}
    />
  );
}
