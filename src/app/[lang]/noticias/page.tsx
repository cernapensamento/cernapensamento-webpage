import React from 'react';
import NewsMosaicGrid from '@/components/features/NewsMosaicGrid';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { getPublicationCards, PUBLICATION_TYPES } from '@/lib/db';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';

export const revalidate = 60;

export default async function NoticiasPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  // Directly fetch all news publications from the database without filters
  const publications = await getPublicationCards({
    type: PUBLICATION_TYPES.NEWS,
    limit: 100,
    lang,
  });

  const pageEyebrow = dict.noticias.eyebrow;
  const pageTitle = dict.noticias.pageTitle;
  const pageDesc = dict.noticias.pageDescription;

  return (
    <main className="flex-grow min-h-screen bg-parchment pt-8 sm:pt-12 pb-24">
      <div className="max-w-[1120px] mx-auto px-5 md:px-16">
        
        {/* Editorial News Header */}
        <RevealOnScroll delayMs={50}>
          <header className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                {pageEyebrow}
              </span>
              <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-charcoal font-bold tracking-tight mb-5">
              {pageTitle}
            </h1>
            <p className="font-sans text-base sm:text-lg text-charcoal/75 max-w-2xl mx-auto leading-relaxed">
              {pageDesc}
            </p>
          </header>
        </RevealOnScroll>

        {/* Architectural News Mosaic Grid (based on diagram) */}
        <NewsMosaicGrid news={publications} lang={lang} dict={dict} />

      </div>
    </main>
  );
}
