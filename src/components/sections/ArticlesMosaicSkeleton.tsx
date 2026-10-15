import React from 'react';
import ArticleSkeleton from '@/components/ui/ArticleSkeleton';

export default function ArticlesMosaicSkeleton() {
  return (
    <div className="w-full flex flex-col gap-16 md:gap-20">
      {/* Level 1: Lead + Duo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 h-full">
          <ArticleSkeleton variant="featured" className="h-full" />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
          <ArticleSkeleton variant="standard" />
          <ArticleSkeleton variant="textOnly" />
        </div>
      </div>

      {/* Level 2: Duo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ArticleSkeleton variant="textOnly" />
        <ArticleSkeleton variant="standard" />
      </div>

      {/* Level 3: 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ArticleSkeleton variant="standard" />
        <ArticleSkeleton variant="textOnly" />
        <ArticleSkeleton variant="standard" />
      </div>
    </div>
  );
}
