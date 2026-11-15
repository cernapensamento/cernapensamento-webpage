import React from 'react';
import type { Metadata } from 'next';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';
import { LegalDocumentMarkdownRenderer } from '@/components/ui/LegalDocumentMarkdownRenderer';
import { getDocument } from '@/lib/content';

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const dict = await getDictionary(locale);

  return {
    title: `${dict.estatutosPage.title} | ${dict.estatutosPage.eyebrow}`,
    description: dict.estatutosPage.metaDescription,
  };
}

export default async function EstatutosPage({ params }: Props) {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const dict = await getDictionary(locale);
  const { content } = getDocument('estatutos', locale);

  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      <main className="px-4 md:px-12 pb-40 pt-16 flex flex-col flex-1">
        {/* Page header */}
        <header className="max-w-275 mx-auto w-full text-center mb-16">
          <p className="font-sans text-sm md:text-base text-gold uppercase tracking-[0.45em] font-semibold mb-5">
            {dict.estatutosPage.eyebrow}
          </p>
          <h1 className="font-serif text-6xl md:text-8xl text-charcoal mb-0 leading-tight">
            {dict.estatutosPage.title}
          </h1>
          <div className="w-12 h-0.5 bg-gold mx-auto mt-8" />
        </header>

        {/* Document card */}
        <div className="max-w-275 mx-auto w-full">
          <div className="bg-surface border border-lines shadow-[0_4px_40px_rgba(0,0,0,0.07)] px-8 py-16 md:px-24 md:py-20">
            <LegalDocumentMarkdownRenderer content={content} />
          </div>
          {/* Bottom meta */}
          <p className="text-center text-xs text-charcoal/40 font-sans mt-8 tracking-wide">
            {dict.estatutosPage.approvalNote}
          </p>
        </div>
      </main>
    </div>
  );
}
