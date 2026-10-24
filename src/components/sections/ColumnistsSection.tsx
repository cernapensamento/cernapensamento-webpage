'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SITE_NAME } from '@/lib/constants';
import { COLUMNISTS as columnists, type Columnist } from '@/lib/columnists';

interface ColumnistsSectionProps {
  lang: string;
  dict: {
    columnists: {
      tag: string;
      title: string;
      publishedArticles: string;
      emailLabel?: string;
      instagramLabel?: string;
      viewAllAuthors?: string;
    };
    authors: Record<string, string>;
  };
}

export default function ColumnistsSection({ lang, dict }: ColumnistsSectionProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768 && window.matchMedia('(hover: hover)').matches);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Preserve scroll anchoring for #autores and #columnistas
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
          const navHeight = nav ? Math.round(nav.getBoundingClientRect().height) : 80;
          const absoluteTop = el.getBoundingClientRect().top + window.scrollY;
          const targetY = Math.round(absoluteTop - navHeight);

          if (Math.abs(window.scrollY - targetY) > 1) {
            window.scrollTo({ top: targetY, behavior });
          }
        }
      }
    };

    scrollToSectionDelimiter('auto');

    const timers = [50, 150, 300, 600, 1000, 1500].map(d =>
      setTimeout(() => {
        if (!userInteracted) scrollToSectionDelimiter('auto');
      }, d)
    );

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      resizeObserver = new ResizeObserver(() => {
        if (!userInteracted) scrollToSectionDelimiter('auto');
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
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  const handleMouseEnter = (id: string) => {
    if (isDesktop) {
      setActiveId(id);
    }
  };

  const handleMouseLeave = () => {
    if (isDesktop) {
      setActiveId(null);
    }
  };

  const handleCardClick = (columnist: Columnist) => {
    const authorHref = `/${lang}/autor/${columnist.slug || columnist.id}`;
    if (activeId === columnist.id) {
      // Second click on mobile or direct click while hovered on desktop
      router.push(authorHref);
    } else {
      setActiveId(columnist.id);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent, columnist: Columnist) => {
    if (!touchStartPos.current) return;
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    touchStartPos.current = null;

    // Only trigger if it was a clean tap (not a scroll gesture)
    if (deltaX < 12 && deltaY < 12) {
      e.preventDefault();
      handleCardClick(columnist);
    }
  };

  const isAnyActive = activeId !== null;

  return (
    <section 
      id="autores" 
      aria-labelledby="authors-heading"
      className="w-full border-t border-lines py-20 sm:py-28 bg-surface scroll-mt-[80px] relative overflow-hidden"
    >
      {/* Decorative literary watermark */}
      <span 
        aria-hidden="true" 
        className="absolute -left-8 -bottom-10 text-[200px] md:text-[260px] font-serif text-charcoal/[0.03] dark:text-parchment/[0.03] select-none pointer-events-none leading-none"
      >
        &sect;
      </span>

      <div className="max-w-[1120px] mx-auto px-5 md:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-18">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-6 h-[2px] bg-gold" aria-hidden="true" />
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
              {dict.columnists.tag}
            </span>
            <span className="w-6 h-[2px] bg-gold" aria-hidden="true" />
          </div>
          <h2 
            id="authors-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal font-bold tracking-tight"
          >
            {dict.columnists.title} {SITE_NAME}
          </h2>
        </div>

        {/* ==================================================== */}
        {/* EXPANDING CARDS CONTAINER (HORIZONTAL ON MD+, RESPONSIVE) */}
        {/* ==================================================== */}
        <div 
          className="flex flex-col md:flex-row gap-4 md:gap-3 w-full min-h-[550px] md:h-[550px] items-stretch"
          role="region"
          aria-label={dict.columnists.title}
        >
          {columnists.map((columnist: Columnist, idx: number) => {
            const isActive = activeId === columnist.id;
            const authorBio = columnist.bio?.[lang as 'gl' | 'es'] || dict.authors[columnist.slug] || '';

            // Responsive flex calculation:
            // Default: 1 (equal distribution)
            // Hovered/Active: 3.5
            // Inactive siblings: 0.8
            const flexValue = isActive ? '3.5 1 0%' : isAnyActive ? '0.8 1 0%' : '1 1 0%';

            return (
              <div
                key={columnist.id}
                tabIndex={0}
                role="button"
                aria-expanded={isActive}
                aria-label={`${columnist.name} - ${authorBio ? authorBio.substring(0, 80) : ''}`}
                onMouseEnter={isDesktop ? () => handleMouseEnter(columnist.id) : undefined}
                onMouseLeave={isDesktop ? handleMouseLeave : undefined}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, columnist)}
                onClick={() => handleCardClick(columnist)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(columnist);
                  }
                }}
                style={{
                  flex: flexValue,
                  transition: 'flex 0.65s cubic-bezier(0.25, 1, 0.5, 1), min-height 0.65s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
                }}
                className={`group relative overflow-hidden border transition-all cursor-pointer select-none touch-manipulation bg-surface dark:bg-[#141414] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  isActive
                    ? 'border-gold shadow-2xl z-20 min-h-[440px] md:min-h-0'
                    : isAnyActive
                      ? 'border-lines/40 opacity-70 z-10 min-h-[100px] md:min-h-0'
                      : 'border-lines hover:border-gold/60 z-10 min-h-[110px] md:min-h-0'
                }`}
              >
                {/* 1. Background Image with Grayscale & Brightness Transition (WebP) */}
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-lines/20">
                  <Image
                    src={columnist.image}
                    alt={`Retrato de ${columnist.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 25vw"
                    priority={idx < 2}
                    className={`object-cover object-top transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                      isActive
                        ? 'filter-none grayscale-0 contrast-100 brightness-100 scale-105'
                        : isAnyActive
                          ? 'filter grayscale contrast-75 brightness-[0.45] dark:brightness-[0.3] scale-100'
                          : 'filter grayscale contrast-90 brightness-[0.65] dark:brightness-[0.45] scale-100'
                    }`}
                  />
                </div>

                {/* 2. Top Vignette Overlay */}
                <div 
                  aria-hidden="true" 
                  className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" 
                />

                {/* 3. Gradient Overlay: White gradient in light mode, Dark gradient in dark mode */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 pointer-events-none transition-all duration-700 ${
                    isActive
                      ? 'h-full bg-gradient-to-t from-white via-white/85 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/85 dark:to-transparent'
                      : 'h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent'
                  }`}
                />

                {/* 5. Card Bottom Content Container */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 z-10 flex flex-col justify-end">
                  
                  {/* Author Name */}
                  <div className="mb-2">
                    <h3 className={`font-serif font-bold leading-tight transition-all duration-500 ${
                      isActive 
                        ? 'text-2xl sm:text-3xl text-charcoal dark:text-white' 
                        : 'text-xl sm:text-2xl text-white group-hover:text-gold'
                    }`}>
                      {columnist.name}
                    </h3>
                    <div className={`h-[2px] transition-all duration-500 mt-2 ${
                      isActive ? 'w-12 bg-gold' : 'w-6 bg-white/40 group-hover:w-10 group-hover:bg-gold'
                    }`} />
                  </div>

                  {/* Bio & Contact Container: Smooth delayed fade-in without layout jumping */}
                  <div 
                    className={`overflow-hidden transition-all duration-500 ease-out max-w-[460px] ${
                      isActive
                        ? 'opacity-100 max-h-96 translate-y-0 delay-200 pointer-events-auto'
                        : 'opacity-0 max-h-0 translate-y-3 delay-0 pointer-events-none'
                    }`}
                  >
                    {authorBio && (
                      <p className="font-sans text-xs sm:text-sm text-charcoal/85 dark:text-neutral-200 leading-relaxed mb-4 mt-2">
                        {authorBio}
                      </p>
                    )}

                    {/* Contact Channels (Correo & Instagram) */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1 pb-1">
                      <a
                        href={`mailto:${columnist.email}`}
                        onClick={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        className="text-xs font-sans text-charcoal/80 dark:text-neutral-200 hover:text-gold dark:hover:text-gold border border-charcoal/20 dark:border-white/20 hover:border-gold dark:hover:border-gold py-1.5 px-3 flex items-center gap-1.5 transition-all bg-white/70 dark:bg-black/50 backdrop-blur-sm"
                        aria-label={`Enviar correo a ${columnist.name}`}
                      >
                        <span className="material-symbols-outlined text-[15px] text-gold" data-icon="mail">mail</span>
                        <span>{dict.columnists.emailLabel || 'Correo'}</span>
                      </a>

                      <a
                        href={`https://instagram.com/${columnist.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        className="text-xs font-sans text-charcoal/80 dark:text-neutral-200 hover:text-gold dark:hover:text-gold border border-charcoal/20 dark:border-white/20 hover:border-gold dark:hover:border-gold py-1.5 px-3 flex items-center gap-1.5 transition-all bg-white/70 dark:bg-black/50 backdrop-blur-sm"
                        aria-label={`Perfil de Instagram de ${columnist.name}`}
                      >
                        <span className="material-symbols-outlined text-[15px] text-gold" data-icon="photo_camera">photo_camera</span>
                        <span>{dict.columnists.instagramLabel || 'Instagram'}</span>
                      </a>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href={`/${lang}/autores`}
            className="group inline-flex items-center gap-3 border border-lines bg-parchment px-6 py-3.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal transition-all duration-300 hover:border-gold hover:text-gold"
          >
            {dict.columnists.viewAllAuthors}
            <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
}
