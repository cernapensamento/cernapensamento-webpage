import React from 'react';
import type { Metadata } from 'next';
import NewsMosaicGrid from '@/components/features/NewsMosaicGrid';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { getPublicationCards, PUBLICATION_TYPES } from '@/lib/db';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';
import { SITE_NAME } from '@/lib/constants';

export const revalidate = 60;

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const dict = await getDictionary(locale);

  return {
    title: `${dict.noticias.pageTitle} | ${SITE_NAME}`,
    description: dict.noticias.pageDescription,
  };
}

export default async function NoticiasPage({ params }: Props) {
  const { lang } = await params;
  const locale = resolveLocale(lang);

  // Directly fetch all news publications from the database without filters
  const [dict, publications] = await Promise.all([
    getDictionary(locale),
    getPublicationCards({
      type: PUBLICATION_TYPES.NEWS,
      limit: 100,
      lang: locale,
    }),
  ]);

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
        <NewsMosaicGrid news={publications} lang={locale} dict={dict} />

      </div>
    </main>
  );
}
