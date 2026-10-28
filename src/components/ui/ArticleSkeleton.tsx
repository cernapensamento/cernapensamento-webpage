import React from 'react';

interface ArticleSkeletonProps {
  variant?: 'featured' | 'standard' | 'textOnly' | 'compact';
  className?: string;
}

export default function ArticleSkeleton({
  variant = 'standard',
  className = '',
}: ArticleSkeletonProps) {
  if (variant === 'featured') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-pulse ${className}`}>
        <div className="md:col-span-7 h-[360px] md:h-[520px] bg-lines/50 w-full" />
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="h-4 bg-lines/70 w-24" />
          <div className="h-10 bg-lines/70 w-full" />
          <div className="h-10 bg-lines/70 w-3/4" />
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-lines/50 w-full" />
            <div className="h-4 bg-lines/50 w-5/6" />
            <div className="h-4 bg-lines/50 w-2/3" />
          </div>
          <div className="pt-4 border-t border-lines w-1/3">
            <div className="h-3 bg-lines/60 w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'textOnly') {
    return (
      <div className={`flex flex-col p-6 sm:p-8 bg-surface border border-lines animate-pulse h-full justify-between ${className}`}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-lines/70 w-20" />
            <div className="h-3 bg-lines/50 w-16" />
          </div>
          <div className="h-7 bg-lines/70 w-full" />
          <div className="h-7 bg-lines/70 w-4/5" />
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-lines/50 w-full" />
            <div className="h-4 bg-lines/50 w-full" />
            <div className="h-4 bg-lines/50 w-3/4" />
          </div>
        </div>
        <div className="pt-6 border-t border-lines flex items-center gap-3 mt-6">
          <div className="w-8 h-8 rounded-full bg-lines/60" />
          <div className="h-3 bg-lines/60 w-28" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col border-b border-lines pb-6 animate-pulse ${className}`}>
        <div className="h-3 bg-lines/70 w-16 mb-2" />
        <div className="h-5 bg-lines/70 w-full mb-2" />
        <div className="h-3 bg-lines/50 w-3/4 mb-3" />
        <div className="h-2 bg-lines/40 w-24" />
      </div>
    );
  }

  // Standard with cover
  return (
    <div className={`flex flex-col h-full animate-pulse ${className}`}>
      <div className="w-full aspect-[16/10] bg-lines/50 mb-4" />
      <div className="h-3 bg-lines/70 w-20 mb-2" />
      <div className="h-6 bg-lines/70 w-full mb-2" />
      <div className="h-6 bg-lines/70 w-3/4 mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-3.5 bg-lines/50 w-full" />
        <div className="h-3.5 bg-lines/50 w-4/5" />
      </div>
      <div className="mt-auto border-t border-lines pt-3 w-1/3">
        <div className="h-3 bg-lines/60 w-20" />
      </div>
    </div>
  );
}
