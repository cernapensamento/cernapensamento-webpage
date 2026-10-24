import React from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

export interface AssociationAndNewsDict {
  badge: string;
  title: string;
  description: string;
  associationCard: {
    tag: string;
    title: string;
    description: string;
    manifestoLink: string;
    statutesLink: string;
    collectionsLink: string;
    button: string;
  };
  newsCard: {
    tag: string;
    title: string;
    description: string;
    previews: Array<{
      category: string;
      title: string;
    }>;
    button: string;
  };
}

interface AssociationAndNewsSectionProps {
  lang: string;
  dict?: AssociationAndNewsDict;
}

export default function AssociationAndNewsSection({ lang, dict }: AssociationAndNewsSectionProps) {
  if (!dict) return null;

  const { badge, title, description, associationCard: assoc, newsCard: news } = dict;

  return (
    <section className="w-full border-t border-lines py-20 md:py-28 bg-parchment">
      <div className="max-w-[1120px] mx-auto px-5 md:px-16 flex flex-col gap-16">
        
        {/* Section Header */}
        <RevealOnScroll className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-lines">
          <div>
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] block mb-3">
              {badge}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal leading-tight">
              {title}
            </h2>
          </div>
          <p className="font-sans text-sm md:text-base text-charcoal/70 max-w-md">
            {description}
          </p>
        </RevealOnScroll>

        {/* Dual Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: Asociación */}
          <RevealOnScroll delayMs={50} className="h-full">
            <div className="bg-surface border border-lines p-8 sm:p-10 flex flex-col justify-between h-full transition-all duration-300 hover:border-gold/60 hover:shadow-lg relative overflow-hidden group">
              <span 
                aria-hidden="true" 
                className="absolute -right-3 -bottom-8 text-8xl sm:text-9xl font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none font-bold"
              >
                § I
              </span>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-gold inline-block" />
                  <span className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">
                    {assoc.tag}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal mb-4 leading-snug">
                  {assoc.title}
                </h3>

                <p className="font-sans text-base text-charcoal/75 leading-relaxed mb-8">
                  {assoc.description}
                </p>

                {/* Sub-links */}
                <div className="flex flex-col gap-3 pt-4 border-t border-lines/70 mb-8">
                  <Link 
                    href={`/${lang}/asociacion`}
                    className="flex items-center justify-between py-2 text-sm text-charcoal/80 hover:text-gold transition-colors font-sans border-b border-lines/40 group/sub"
                  >
                    <span>{assoc.manifestoLink}</span>
                    <span className="text-xs transition-transform group-hover/sub:translate-x-1">→</span>
                  </Link>
                  <Link 
                    href={`/${lang}/asociacion/estatutos`}
                    className="flex items-center justify-between py-2 text-sm text-charcoal/80 hover:text-gold transition-colors font-sans border-b border-lines/40 group/sub"
                  >
                    <span>{assoc.statutesLink}</span>
                    <span className="text-xs transition-transform group-hover/sub:translate-x-1">→</span>
                  </Link>
                  <Link 
                    href={`/${lang}/asociacion`}
                    className="flex items-center justify-between py-2 text-sm text-charcoal/80 hover:text-gold transition-colors font-sans group/sub"
                  >
                    <span>{assoc.collectionsLink}</span>
                    <span className="text-xs transition-transform group-hover/sub:translate-x-1">→</span>
                  </Link>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <Link
                  href={`/${lang}/asociacion`}
                  className="btn-primary w-full sm:w-auto"
                >
                  <span>{assoc.button}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </RevealOnScroll>

          {/* Card 2: Noticias */}
          <RevealOnScroll delayMs={150} className="h-full">
            <div className="bg-surface border border-lines p-8 sm:p-10 flex flex-col justify-between h-full transition-all duration-300 hover:border-gold/60 hover:shadow-lg relative overflow-hidden group">
              <span 
                aria-hidden="true" 
                className="absolute -right-3 -bottom-8 text-8xl sm:text-9xl font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none font-bold"
              >
                § II
              </span>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-charcoal inline-block" />
                  <span className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">
                    {news.tag}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal mb-4 leading-snug">
                  {news.title}
                </h3>

                <p className="font-sans text-base text-charcoal/75 leading-relaxed mb-8">
                  {news.description}
                </p>

                {/* News Highlights preview */}
                <div className="flex flex-col gap-3 pt-4 border-t border-lines/70 mb-8">
                  {news.previews.map((item, idx) => (
                    <div key={idx} className={`py-2 ${idx < news.previews.length - 1 ? 'border-b border-lines/40' : ''}`}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gold block mb-1">
                        {item.category}
                      </span>
                      <p className="text-sm text-charcoal/90 font-medium">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <Link
                  href={`/${lang}/noticias`}
                  className="btn-outline w-full sm:w-auto"
                >
                  <span>{news.button}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </RevealOnScroll>

        </div>
      </div>
    </section>
  );
}
