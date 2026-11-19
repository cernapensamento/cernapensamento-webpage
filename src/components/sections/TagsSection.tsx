import React from 'react';
import Link from 'next/link';
import type { TagItem } from '@/lib/db/types';
import type { Dictionary } from '@/dictionaries';
import { slugify } from '@/lib/utils/slug';

interface TagDisplayItem {
  name: string;
  slug: string;
}

interface MarqueeRowData {
  items: TagDisplayItem[];
  uniqueCount: number;
}

interface TagsSectionProps {
  lang: string;
  dict: Dictionary['tags'];
  tags?: TagItem[];
}

const RESPONSIVE_LAYOUTS = [
  { rowCount: 2, visibilityClass: 'flex sm:hidden' },
  { rowCount: 3, visibilityClass: 'hidden sm:flex lg:hidden' },
  { rowCount: 4, visibilityClass: 'hidden lg:flex' },
] as const;

const MIN_ITEMS_PER_HALF_TRACK = 8;
const MIN_ESTIMATED_HALF_WIDTH_PX = 2400;
const ROW_DURATIONS = ['96s', '114s', '88s', '104s'] as const;
const ROW_OFFSETS = ['0s', '-32s', '-16s', '-48s'] as const;

function estimateHalfTrackWidth(items: TagDisplayItem[]): number {
  return items.reduce((total, item) => total + item.name.length * 10 + 64, 0);
}

/**
 * Distributes tags round-robin across `rowCount` rows and pads short rows
 * so the `-50%` infinite marquee track exceeds wide desktop viewports without blank gaps.
 * Tracks `uniqueCount` so padding/loop duplicates can be hidden under reduced motion.
 */
function buildMarqueeRows(items: TagDisplayItem[], rowCount: number): MarqueeRowData[] {
  if (items.length === 0) return [];

  const buckets: TagDisplayItem[][] = Array.from({ length: rowCount }, () => []);
  items.forEach((item, idx) => {
    buckets[idx % rowCount].push(item);
  });

  return buckets.map((bucket) => {
    const uniqueCount = bucket.length;
    const source = uniqueCount > 0 ? bucket : items;
    const estimatedWidth = Math.max(1, estimateHalfTrackWidth(source));
    const repeats = Math.max(
      1,
      Math.ceil(MIN_ITEMS_PER_HALF_TRACK / source.length),
      Math.ceil(MIN_ESTIMATED_HALF_WIDTH_PX / estimatedWidth)
    );

    const halfTrack: TagDisplayItem[] = [];
    for (let i = 0; i < repeats; i += 1) {
      halfTrack.push(...source);
    }
    return { items: halfTrack, uniqueCount };
  });
}

function normalizeTags(tags: TagItem[] | undefined, fallbackList: string[]): TagDisplayItem[] {
  if (tags && tags.length > 0) {
    return tags.map((tag) => ({ name: tag.name, slug: tag.slug }));
  }
  return fallbackList.map((name) => ({
    name,
    slug: slugify(name),
  }));
}

/**
 * Homepage section showcasing all localized publication tags in a staggered
 * multi-row horizontal marquee (2 mobile, 3 tablet, 4 desktop) linking into the archive.
 */
export default function TagsSection({ lang, dict, tags }: TagsSectionProps) {
  const normalizedTags = normalizeTags(tags, dict.list);

  return (
    <section
      aria-labelledby="tags-heading"
      className="w-full py-12 sm:py-16 bg-parchment border-t border-lines relative overflow-hidden"
    >
      {/* Upper Section Header */}
      <div className="max-w-[1120px] mx-auto px-5 md:px-16 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-5 border-b border-lines">
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                {dict.tag}
              </span>
            </div>
            <h2
              id="tags-heading"
              className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal font-bold tracking-tight leading-tight"
            >
              {dict.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Responsive Multi-Row Horizontal Tag Marquee */}
      <div className="tags-marquee relative w-full overflow-hidden py-1">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-20 md:w-28 bg-gradient-to-r from-parchment to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-20 md:w-28 bg-gradient-to-l from-parchment to-transparent z-10" />

        {RESPONSIVE_LAYOUTS.map(({ rowCount, visibilityClass }) => {
          const rows = buildMarqueeRows(normalizedTags, rowCount);
          return (
            <div
              key={rowCount}
              data-testid={`tags-marquee-${rowCount}-rows`}
              className={`flex-col gap-3 ${visibilityClass}`}
            >
              {rows.map((row, rowIndex) => {
                const loopItems = [...row.items, ...row.items];
                return (
                  <div key={rowIndex} className="tags-marquee-row w-full overflow-hidden">
                    <ul
                      className="animate-marquee-infinite flex items-center gap-3 pr-3 list-none m-0"
                      style={{
                        animationDuration: ROW_DURATIONS[rowIndex % ROW_DURATIONS.length],
                        animationDelay: ROW_OFFSETS[rowIndex % ROW_OFFSETS.length],
                      }}
                    >
                      {loopItems.map((tag, idx) => {
                        const isClone = idx >= row.uniqueCount;
                        return (
                          <li
                            key={`${rowCount}-${rowIndex}-${tag.slug}-${idx}`}
                            className="shrink-0"
                            data-marquee-clone={isClone ? 'true' : undefined}
                            aria-hidden={isClone ? true : undefined}
                          >
                            <Link
                              href={`/${lang}/articulos?tema=${encodeURIComponent(tag.slug)}`}
                              tabIndex={isClone ? -1 : undefined}
                              className="inline-block whitespace-nowrap bg-surface border border-lines px-6 py-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-charcoal hover:border-gold hover:text-gold transition-colors duration-300 shadow-sm select-none"
                            >
                              {tag.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom Archive CTA Link */}
      <div className="max-w-[1120px] mx-auto px-5 md:px-16 relative z-10">
        <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-charcoal/65">
          <span>{dict.searchPrompt}</span>
          <Link
            href={`/${lang}/articulos`}
            className="group font-bold text-charcoal hover:text-gold uppercase tracking-wider underline underline-offset-4 shrink-0 transition-colors inline-flex items-center gap-1.5"
          >
            <span>{dict.exploreButton}</span>
            <span
              className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
