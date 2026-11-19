import React from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { Dictionary } from '@/dictionaries/client';

export type OpenPublishingDict = Dictionary['openPublishing'];

interface OpenPublishingSectionProps {
  lang: string;
  dict: OpenPublishingDict;
}

export default function OpenPublishingSection({ lang, dict }: OpenPublishingSectionProps) {
  return (
    <section
      aria-labelledby="open-publishing-heading"
      className="w-full border-t border-lines py-20 md:py-28 bg-parchment"
    >
      <div className="max-w-[1120px] mx-auto px-5 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left column: Editorial statement & stacked CTAs */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <RevealOnScroll delayMs={50}>
              <div className="flex items-center gap-3">
                <span className="w-6 h-[2px] bg-gold" aria-hidden="true" />
                <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                  {dict.badge}
                </span>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delayMs={100}>
              <h2
                id="open-publishing-heading"
                className="font-serif text-3xl sm:text-4xl md:text-[2.65rem] text-charcoal leading-[1.15] tracking-tight"
              >
                {dict.title}
              </h2>
            </RevealOnScroll>

            <RevealOnScroll delayMs={150}>
              <p className="font-sans text-base text-charcoal/75 leading-relaxed">
                {dict.lead}
              </p>
            </RevealOnScroll>

            <RevealOnScroll delayMs={200}>
              <div className="flex flex-col items-start gap-3 pt-2">
                <Link href={`/${lang}/contacto`} className="btn-primary group">
                  <span>{dict.primaryCta}</span>
                  <span
                    className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    arrow_forward
                  </span>
                </Link>

                <Link
                  href={`/${lang}/asociacion#coleccions`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-charcoal/70 hover:text-gold transition-colors py-2 group"
                >
                  <span>{dict.secondaryCta}</span>
                  <span
                    className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  >
                    north_east
                  </span>
                </Link>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right column: Ruled vertical 1-2-3 editorial stepper */}
          <div className="lg:col-span-7">
            <RevealOnScroll delayMs={100}>
              <div className="pb-4 border-b border-charcoal/20">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal/60">
                  {dict.stepsLabel}
                </span>
              </div>
            </RevealOnScroll>

            <ol className="divide-y divide-lines">
              {dict.steps.map((step, idx) => (
                <li key={step.num} className="py-8 first:pt-7 group">
                  <RevealOnScroll
                    delayMs={120 + idx * 70}
                    className="flex flex-col sm:flex-row gap-5 sm:gap-8"
                  >
                    <div className="flex items-baseline gap-3 sm:block sm:w-16 shrink-0">
                      <span className="font-serif text-4xl sm:text-5xl text-gold/85 leading-none select-none transition-colors group-hover:text-gold">
                        {step.num}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold block mb-1.5">
                        {step.tag}
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl text-charcoal mb-2 leading-snug">
                        {step.title}
                      </h3>
                      <p className="font-sans text-sm sm:text-base text-charcoal/70 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </RevealOnScroll>
                </li>
              ))}
            </ol>

            {/* Understated editorial quota footnote */}
            <RevealOnScroll delayMs={250}>
              <div className="mt-2 pt-6 border-t border-lines flex items-start gap-3 text-charcoal/65">
                <span
                  className="material-symbols-outlined text-base text-gold shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  info
                </span>
                <p className="font-sans text-xs sm:text-sm leading-relaxed">
                  <strong className="text-charcoal/85 font-semibold">{dict.quotaLabel}:</strong>{' '}
                  {dict.quotaNote}
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
