import React from 'react';
import type { IndexItem } from '@/lib/editor/ArticleIndexExtension';

export interface ArticleTableOfContentsItem extends IndexItem {
  id?: string;
}

interface ArticleTableOfContentsProps {
  items: ArticleTableOfContentsItem[];
  label: string;
  ariaLabel: string;
  onItemClick?: (e: React.MouseEvent<HTMLAnchorElement>, item: ArticleTableOfContentsItem) => void;
  className?: string;
}

const INDENT_CLASSES: Record<number, string> = {
  1: 'pl-0',
  2: 'pl-6',
  3: 'pl-12',
};

const NUM_WIDTH_CLASSES: Record<number, string> = {
  1: 'min-w-[1.75rem]',
  2: 'min-w-[2.75rem]',
  3: 'min-w-[3.75rem]',
};

const LINK_TYPOGRAPHY_CLASSES: Record<number, string> = {
  1: 'text-[1.15rem] font-semibold text-charcoal',
  2: 'text-[1.05rem] font-normal text-charcoal/90',
  3: 'text-[0.95rem] font-normal text-charcoal/75',
};

/**
 * Editorial Table of Contents rendered above article body copy.
 * Used declaratively when an article has `show_index` enabled, across the public
 * reader, the author's publication preview modal, and live writing preview.
 */
export default function ArticleTableOfContents({
  items,
  label,
  ariaLabel,
  onItemClick,
  className = '',
}: ArticleTableOfContentsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      data-type="article-index"
      aria-label={ariaLabel}
      className={`border-y border-gold/40 py-7 px-6 sm:px-8 mb-10 ${className}`.trim()}
    >
      <div className="block font-sans text-xs font-bold tracking-[0.2em] uppercase text-gold mb-4">
        {label}
      </div>
      <div role="list" className="flex flex-col gap-1">
        {items.map((item, idx) => {
          const level = Math.min(Math.max(item.path.length, 1), 3);
          const num = `${item.path.join('.')}.`;
          const indentClass = INDENT_CLASSES[level] ?? 'pl-0';
          const numWidthClass = NUM_WIDTH_CLASSES[level] ?? 'min-w-[1.75rem]';
          const linkTypographyClass = LINK_TYPOGRAPHY_CLASSES[level] ?? LINK_TYPOGRAPHY_CLASSES[1];

          return (
            <div
              key={item.id ?? `${item.slug}-${idx}`}
              role="listitem"
              className={`flex items-baseline gap-2 py-1 ${indentClass}`}
            >
              <span
                className={`font-sans text-[0.95rem] font-semibold tracking-[0.02em] text-gold shrink-0 tabular-nums ${numWidthClass}`}
              >
                {num}
              </span>
              <a
                href={`#${item.slug}`}
                onClick={onItemClick ? (e) => onItemClick(e, item) : undefined}
                className={`font-serif leading-relaxed no-underline hover:text-gold transition-colors ${linkTypographyClass}`}
              >
                {item.text}
              </a>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
