import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AboutUsSectionProps {
  lang: string;
  dict: {
    title: string;
    subtitle: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    button: string;
    pullQuote?: string;
    pillars?: Array<{ num: string; title: string; desc: string }>;
    secondaryButton?: string;
    legalFramework?: string;
  };
}

export default function AboutUsSection({ lang, dict }: AboutUsSectionProps) {
  if (!dict) return null;

  return (
    <section 
      aria-labelledby="about-heading"
      className="w-full py-20 sm:py-28 bg-surface border-t border-lines relative overflow-hidden"
    >
      {/* Decorative literary watermark */}
      <span 
        aria-hidden="true" 
        className="absolute -left-10 -bottom-10 text-[220px] md:text-[280px] font-serif text-charcoal/[0.03] dark:text-parchment/[0.03] select-none pointer-events-none leading-none"
      >
        ¶
      </span>

      <div className="max-w-[1120px] mx-auto px-5 md:px-16 relative z-10">
        
        {/* Upper Editorial Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="w-6 h-[2px] bg-gold" aria-hidden="true" />
          <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
            {dict.title}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: Headline, Pull Quote & Core Pillars (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div>
              <h2 
                id="about-heading"
                className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal font-bold tracking-tight leading-[1.15] mb-8"
              >
                {dict.subtitle}
              </h2>

              {dict.pullQuote && (
                <div className="border-l-2 border-gold/70 pl-6 py-2 my-8 bg-parchment/60">
                  <p className="font-serif italic text-lg sm:text-xl text-charcoal/90 leading-relaxed">
                    &ldquo;{dict.pullQuote}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Editorial Pillars */}
            {dict.pillars && dict.pillars.length > 0 && (
              <div className="mt-6 pt-8 border-t border-lines flex flex-col gap-5">
                {dict.pillars.map((pillar) => (
                  <div key={pillar.num} className="flex items-start gap-4">
                    <span className="font-mono text-xs font-bold text-gold pt-0.5 select-none shrink-0">
                      {pillar.num}
                    </span>
                    <div>
                      <h3 className="font-sans font-bold text-sm text-charcoal tracking-wide">
                        {pillar.title}
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-charcoal/65 mt-0.5 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10 pt-4">
              <Link 
                href={`/${lang}/asociacion`}
                className="btn-outline text-xs tracking-[0.2em] inline-flex items-center gap-2"
              >
                <span>{dict.button}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: The Editorial Prose & Drop-Cap (7 cols) */}
          <div className="lg:col-span-7 bg-parchment border border-lines p-8 sm:p-12 relative flex flex-col justify-between shadow-sm">
            <div className="space-y-6 font-sans text-base sm:text-lg text-charcoal/85 leading-relaxed">
              <p>
                <span className="float-left mr-4 mt-1 relative w-16 h-16 sm:w-20 sm:h-20 inline-block select-none shrink-0">
                  <Image
                    src="/images/logo/screen.webp"
                    alt="Cerna"
                    fill
                    className="object-contain block dark:hidden drop-shadow-sm"
                    unoptimized
                  />
                  <Image
                    src="/images/logo/screen_black.webp"
                    alt="Cerna"
                    fill
                    className="object-contain hidden dark:block drop-shadow-sm"
                    unoptimized
                  />
                </span>
                <span className="font-serif font-bold tracking-wider text-charcoal text-lg sm:text-xl">CERNA</span>
                {dict.paragraph1.startsWith('CERNA') 
                  ? dict.paragraph1.slice(5) 
                  : dict.paragraph1}
              </p>
              <p>
                {dict.paragraph2}
              </p>
              <p>
                {dict.paragraph3}
              </p>
            </div>

            {dict.secondaryButton && (
              <div className="mt-10 pt-6 border-t border-lines flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-widest text-charcoal/50">
                  {dict.legalFramework}
                </span>
                <Link
                  href={`/${lang}/asociacion/estatutos`}
                  className="text-xs font-bold uppercase tracking-wider text-charcoal/80 hover:text-gold transition-colors flex items-center gap-1.5"
                >
                  <span>{dict.secondaryButton}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
