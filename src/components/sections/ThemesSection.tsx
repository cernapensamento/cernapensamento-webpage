'use client';

import React from 'react';
import Link from 'next/link';
import type { TagItem } from '@/lib/db/types';

export interface ThemeDossierItem {
  id: string;
  title: string;
  desc: string;
  slug?: string;
}

interface ThemesSectionProps {
  lang: string;
  dict: {
    tag: string;
    title: string;
    description: string;
    list: string[];
    exploreButton: string;
    continuousScroll?: string;
    items?: ThemeDossierItem[];
    cardAction?: string;
    searchPrompt?: string;
  };
  tags?: TagItem[];
}

export default function ThemesSection({ lang, dict, tags }: ThemesSectionProps) {
  if (!dict) return null;

  // If real database tags are supplied, use up to 12 database tags with their exact slug and localized name.
  // Otherwise fall back to dictionary list.
  const baseItems: ThemeDossierItem[] = (tags && tags.length > 0)
    ? tags.slice(0, 12).map((tag, idx) => ({
        id: String(idx + 1).padStart(2, '0'),
        title: tag.name,
        slug: tag.slug,
        desc: dict.description,
      }))
    : (dict.items || dict.list.slice(0, 12).map((tema, idx) => ({
        id: String(idx + 1).padStart(2, '0'),
        title: tema,
        slug: tema.toLowerCase().replace(/\s+/g, '-'),
        desc: dict.description,
      })));

  // Duplicate items for continuous seamless loop
  const infiniteItems = [...baseItems, ...baseItems];

  return (
    <section 
      aria-labelledby="themes-heading"
      className="w-full py-12 sm:py-16 bg-parchment border-t border-lines relative overflow-hidden"
    >
      <div className="max-w-[1120px] mx-auto px-5 md:px-16 relative z-10">
        
        {/* Upper Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-5 border-b border-lines">
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                {dict.tag}
              </span>
            </div>
            <h2 
              id="themes-heading"
              className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal font-bold tracking-tight leading-tight"
            >
              {dict.title}
            </h2>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* INFINITE SMOOTH AUTOPLAY CAROUSEL */}
      {/* ==================================================== */}
      <div className="relative w-full overflow-hidden group">
        {/* Left & Right gradient edge fades for smooth entry/exit */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-r from-parchment to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-l from-parchment to-transparent z-10" />

        <div className="animate-marquee-infinite flex gap-3.5 py-2 px-4">
          {infiniteItems.map((item, index) => (
            <Link
              key={`${item.id}-${index}`}
              href={`/${lang}/articulos?tema=${encodeURIComponent(item.slug || item.title)}`}
              className="group/card shrink-0 w-[210px] sm:w-[250px] bg-surface border border-lines p-4 sm:p-4.5 flex flex-col justify-between hover:border-gold hover:shadow-md transition-all duration-300 relative select-none"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-[9px] font-bold text-gold uppercase tracking-[0.18em] border border-lines dark:border-white/15 bg-surface dark:bg-white/[0.04] px-2 py-0.5">
                    § {item.id}
                  </span>
                  <span className="text-charcoal/40 group-hover/card:text-gold transition-colors text-xs" aria-hidden="true">
                    <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover/card:translate-x-1">
                      arrow_forward
                    </span>
                  </span>
                </div>
                
                <h3 className="font-serif text-base sm:text-lg text-charcoal font-bold group-hover/card:text-gold transition-colors leading-snug mb-1.5">
                  {item.title}
                </h3>

                <p className="font-sans text-xs text-charcoal/70 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {dict.cardAction && (
                <div className="pt-2.5 mt-3 border-t border-lines/50 flex items-center justify-between text-[10px] font-sans font-semibold text-charcoal/60 group-hover/card:text-gold transition-colors">
                  <span>{dict.cardAction}</span>
                  <span>§</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-[1120px] mx-auto px-5 md:px-16 relative z-10">
        {/* Bottom Archive CTA Link */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-charcoal/65">
          {dict.searchPrompt && (
            <span>{dict.searchPrompt}</span>
          )}
          <Link 
            href={`/${lang}/articulos`} 
            className="group font-bold text-charcoal hover:text-gold uppercase tracking-wider underline underline-offset-4 shrink-0 transition-colors inline-flex items-center gap-1.5"
          >
            <span>{dict.exploreButton}</span>
            <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
