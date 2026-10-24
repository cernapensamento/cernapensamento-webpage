import React from 'react';
import { getPublicationCards } from '@/lib/db/queries/publications';
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
  // Fetch up to 24 publication cards sorted strictly by created_at DESC
  const allArticles = await getPublicationCards({
    limit: 24,
    lang,
  });

  // Strict sorting by created_at descending (publication date)
  const sortedArticles = [...allArticles].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeB - timeA;
  });

  const pinnedArticles = sortedArticles.filter((a) => a.is_pinned);
  const regularArticles = sortedArticles.filter((a) => !a.is_pinned);

  return (
    <ArticlesMosaicSection
      articulos={regularArticles}
      pinnedArticulos={pinnedArticles}
      lang={lang}
      dict={dict}
    />
  );
}
