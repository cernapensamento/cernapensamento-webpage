'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

import { COLUMNISTS as columnists } from '@/lib/columnists';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

interface ColumnistsSectionProps {
  lang: string;
  dict: {
    columnists: {
      tag: string;
      title: string;
      publishedArticles: string;
    };
    authors: Record<string, string>;
  };
}

export default function ColumnistsSection({ lang, dict }: ColumnistsSectionProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let userInteracted = false;
    const markInteracted = () => {
      userInteracted = true;
    };

    window.addEventListener('wheel', markInteracted, { passive: true });
    window.addEventListener('touchmove', markInteracted, { passive: true });
    window.addEventListener('keydown', markInteracted, { passive: true });

    const scrollToSectionDelimiter = (behavior: ScrollBehavior = 'auto') => {
      const hash = window.location.hash;
      if (hash === '#autores' || hash === '#columnistas') {
        const el = document.getElementById('autores');
        if (el) {
          const nav = document.querySelector('nav');
          const navHeight = nav ? Math.round(nav.getBoundingClientRect().height) : 89;
          const absoluteTop = el.getBoundingClientRect().top + window.scrollY;
          const targetY = Math.round(absoluteTop - navHeight);
          
          if (Math.abs(window.scrollY - targetY) > 1) {
            window.scrollTo({ top: targetY, behavior });
          }
        }
      }
    };

    // Immediate attempt
    scrollToSectionDelimiter('auto');

    // Timers for font and content rendering phases
    const timers = [50, 150, 300, 600, 1000, 1500, 2200].map(d =>
      setTimeout(() => {
        if (!userInteracted) scrollToSectionDelimiter('auto');
      }, d)
    );

    // ResizeObserver on document.body to react to dynamic image loads above the section
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      resizeObserver = new ResizeObserver(() => {
        if (!userInteracted) {
          scrollToSectionDelimiter('auto');
        }
      });
      resizeObserver.observe(document.body);
    }

    const onHashChange = () => {
      userInteracted = false;
      scrollToSectionDelimiter('smooth');
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('wheel', markInteracted);
      window.removeEventListener('touchmove', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <section id="autores" className="w-full border-t border-lines py-24 bg-surface scroll-mt-[89px]">
      <div className="max-w-[1120px] mx-auto px-5 md:px-16">
        <div className="text-center mb-20">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-4">{dict.columnists.tag}</span>
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal">{dict.columnists.title} {SITE_NAME}</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {columnists.map((columnist, idx) => (
            <RevealOnScroll
              key={columnist.id}
              delayMs={idx * 120}
              className="h-full"
            >
              <div className="flex flex-col items-center group bg-parchment/60 hover:bg-parchment border border-lines/70 hover:border-gold/50 p-6 sm:p-7 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-xl h-full justify-between">
                
                {/* Top: Avatar & Name */}
                <div className="flex flex-col items-center w-full">
                  <Link
                    href={`/${lang}/autor/${columnist.slug || columnist.id}`}
                    className="relative w-36 h-36 sm:w-40 sm:h-40 mb-6 rounded-full overflow-hidden border-2 border-lines group-hover:border-gold transition-all duration-500 shadow-sm group-hover:shadow-md block shrink-0"
                  >
                    <Image
                      src={columnist.image}
                      alt={`Retrato de ${columnist.name}`}
                      fill
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                      sizes="(max-width: 768px) 160px, 140px"
                      unoptimized
                    />
                    <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 group-hover:ring-gold/30 transition-colors pointer-events-none" />
                  </Link>

                  <Link href={`/${lang}/autor/${columnist.slug || columnist.id}`}>
                    <h3 className="font-serif text-2xl text-charcoal group-hover:text-gold transition-colors duration-300 mb-2 text-center font-bold">
                      {columnist.name}
                    </h3>
                  </Link>

                  {/* Animated Accent Line */}
                  <div className="w-8 h-[2px] bg-lines group-hover:w-14 group-hover:bg-gold transition-all duration-500 my-3" />

                  {/* Social Channels */}
                  <div className="flex items-center justify-center gap-3 w-full my-2">
                    <a
                      href={`mailto:${columnist.email}`}
                      className="text-charcoal/60 hover:text-gold transition-all duration-200 flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider py-1 px-2 border border-lines/60 hover:border-gold/60 hover:-translate-y-0.5"
                      aria-label={`Enviar correo a ${columnist.name}`}
                    >
                      <span className="material-symbols-outlined text-[15px]" data-icon="mail">mail</span>
                      <span>Correo</span>
                    </a>

                    <a
                      href={`https://instagram.com/${columnist.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-charcoal/60 hover:text-gold transition-all duration-200 flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider py-1 px-2 border border-lines/60 hover:border-gold/60 hover:-translate-y-0.5"
                      aria-label={`Perfil de Instagram de ${columnist.name}`}
                    >
                      <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                      <span>Instagram</span>
                    </a>
                  </div>

                  {/* Bio */}
                  <p className="font-sans text-xs sm:text-sm text-charcoal/70 text-center leading-relaxed mt-4 line-clamp-4">
                    {dict.authors[columnist.slug] || ''}
                  </p>
                </div>

                {/* Bottom CTA Button */}
                <div className="w-full pt-6 mt-4 border-t border-lines/50 flex justify-center">
                  <Link
                    href={`/${lang}/autor/${columnist.slug || columnist.id}`}
                    className="btn-outline text-[10px] tracking-[0.16em] py-2 px-4 w-full text-center group-hover:bg-charcoal group-hover:text-parchment group-hover:border-charcoal transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <span>{dict.columnists.publishedArticles}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                  </Link>
                </div>

              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
