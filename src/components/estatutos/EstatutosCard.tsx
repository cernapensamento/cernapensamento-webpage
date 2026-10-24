import React from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface EstatutosCardProps {
  lang: string;
  title: string;
  description: string;
  readMoreText: string;
  legalFramework?: string;
}

export function EstatutosCard({ lang, title, description, readMoreText, legalFramework }: EstatutosCardProps) {
  const dict = lang === 'es' ? esDict : glDict;
  const badgeText = legalFramework || dict.asociacion.legalFramework;

  return (
    <section id="estatutos" aria-labelledby="estatutos-title" className="mt-20 scroll-mt-32">
      <RevealOnScroll delayMs={100}>
        <div className="bg-surface border border-lines p-8 sm:p-12 md:p-14 relative overflow-hidden transition-all duration-500 hover:border-gold/60 hover:shadow-lg group">
          {/* Subtle editorial watermark */}
          <span 
            aria-hidden="true" 
            className="absolute -right-4 -bottom-10 text-[180px] sm:text-[220px] font-serif text-charcoal/[0.03] dark:text-parchment/[0.03] select-none pointer-events-none leading-none font-bold"
          >
            §
          </span>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
                <span className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">
                  {badgeText}
                </span>
              </div>

              <h3 
                id="estatutos-title" 
                className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal font-bold group-hover:text-gold transition-colors mb-4 leading-tight"
              >
                {title}
              </h3>

              <p className="font-sans text-base sm:text-lg text-charcoal/80 leading-relaxed max-w-2xl">
                {description}
              </p>
            </div>

            <div className="shrink-0 flex items-center pt-2 lg:pt-0">
              <Link 
                href={`/${lang}/asociacion/estatutos`}
                className="btn-primary text-xs tracking-[0.16em] font-bold inline-flex items-center gap-2.5 group/btn shadow-sm"
              >
                <span>{readMoreText}</span>
                <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover/btn:translate-x-1" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
