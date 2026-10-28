import React from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import HeroAnimatedLogo from './HeroAnimatedLogo';

export interface HeroDict {
  headlinePrefix: string;
  headlineHighlight: string;
  description: string;
  exploreCta?: string;
  secondaryCta?: string;
}

interface HeroIntroSectionProps {
  lang: string;
  dict: HeroDict;
}

export default function HeroIntroSection({ lang, dict }: HeroIntroSectionProps) {
  if (!dict) return null;

  const { headlinePrefix, headlineHighlight, description } = dict;
  const exploreCta = dict.exploreCta || dict.secondaryCta || '';

  return (
    <section className="w-full bg-parchment border-b border-lines pt-6 pb-12 sm:pt-14 sm:pb-20 lg:py-28 relative overflow-hidden">
      {/* Subtle literary background watermark */}
      <span 
        aria-hidden="true" 
        className="absolute -right-8 -bottom-16 text-[260px] md:text-[340px] font-serif text-charcoal/[0.03] dark:text-parchment/[0.03] select-none pointer-events-none leading-none"
      >
        &para;
      </span>

      <div className="max-w-[1120px] mx-auto px-5 md:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-center">
          
          {/* ==================================================== */}
          {/* EDITORIAL HEADLINE, ACCENT & DESCRIPTION (LEFT ON LG, BOTTOM ON VERTICAL) */}
          {/* ==================================================== */}
          <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col justify-center">
            <RevealOnScroll delayMs={100}>
              {/* Headline with golden accent detail */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[52px] text-charcoal font-bold tracking-tight leading-[1.14] mb-4 sm:mb-6">
                <span>{headlinePrefix}</span>
                <br />
                <span className="text-gold italic font-normal underline decoration-gold/30 underline-offset-8">
                  {headlineHighlight}
                </span>
              </h1>

              {/* Description */}
              <p className="font-sans text-sm sm:text-base lg:text-lg text-charcoal/75 leading-relaxed max-w-xl mb-6 sm:mb-8">
                {description}
              </p>

              {/* Only CTA: Explorar Publicacións */}
              <div className="pt-1 sm:pt-2">
                <Link
                  href={`/${lang}/articulos`}
                  className="btn-primary text-xs tracking-[0.16em] group inline-flex items-center gap-2"
                >
                  <span>{exploreCta}</span>
                  <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </RevealOnScroll>
          </div>

          {/* ==================================================== */}
          {/* CERNA ANIMATED LOGO EMBLEM (TOP ON VERTICAL, RIGHT ON LG) */}
          {/* ==================================================== */}
          <div className="order-1 lg:order-2 lg:col-span-7 flex justify-center lg:justify-end items-center">
            <RevealOnScroll delayMs={50} className="w-full flex justify-center lg:justify-end">
              <HeroAnimatedLogo className="w-full max-w-[560px] sm:max-w-[700px] md:max-w-[820px] lg:max-w-[960px] aspect-[92/34] transition-transform duration-700 hover:scale-[1.01]" />
            </RevealOnScroll>
          </div>

        </div>
      </div>
    </section>
  );
}
