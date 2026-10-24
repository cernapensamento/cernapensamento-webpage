import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-16 items-center">
          
          {/* ==================================================== */}
          {/* EDITORIAL HEADLINE, ACCENT & DESCRIPTION (LEFT ON LG, BOTTOM ON VERTICAL) */}
          {/* ==================================================== */}
          <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-center">
            <RevealOnScroll delayMs={100}>
              {/* Headline with golden accent detail */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[58px] text-charcoal font-bold tracking-tight leading-[1.14] mb-4 sm:mb-6">
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
                  className="btn-primary text-xs tracking-[0.16em]"
                >
                  <span>{exploreCta}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </RevealOnScroll>
          </div>

          {/* ==================================================== */}
          {/* CERNA LOGO (TOP ON VERTICAL, RIGHT ON LG) */}
          {/* ==================================================== */}
          <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center lg:justify-end items-center">
            <RevealOnScroll delayMs={50} className="w-full flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[320px] sm:max-w-[400px] md:max-w-[460px] lg:max-w-[500px] h-32 sm:h-44 md:h-56 lg:h-64 flex items-center justify-center transition-transform duration-700 hover:scale-[1.02]">
                <Image
                  src="/images/logo/cernawhite.webp"
                  alt="Cerna Pensamento"
                  fill
                  className="object-contain block dark:hidden drop-shadow-sm"
                  priority
                  unoptimized
                />
                <Image
                  src="/images/logo/cernablack.webp"
                  alt="Cerna Pensamento"
                  fill
                  className="object-contain hidden dark:block drop-shadow-sm"
                  priority
                  unoptimized
                />
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </div>
    </section>
  );
}
