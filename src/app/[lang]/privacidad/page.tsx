import React from 'react';
import type { Metadata } from 'next';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';
import { getDocument } from '@/lib/content';
import { LegalDocumentMarkdownRenderer } from '@/components/ui/LegalDocumentMarkdownRenderer';

const PRIVACY_CONTACT_EMAIL = 'contacto@cernapensamento.org';

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return {
    title: `${dict.privacyPage.title} | Asociación Cerna Pensamento`,
    description: dict.privacyPage.metaDescription,
  };
}

export default async function PrivacidadPage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const { content } = getDocument('privacidad', lang);

  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      <section className="flex flex-1 flex-col px-4 pb-24 pt-10 md:px-12 md:pb-40 md:pt-16">
        <header className="mx-auto mb-10 w-full max-w-275 text-center md:mb-16">
          <p className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-gold md:mb-5 md:text-base md:tracking-[0.45em]">
            {dict.privacyPage.eyebrow}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-charcoal mb-0 leading-tight">
            {dict.privacyPage.title}
          </h1>
          <div className="w-12 h-0.5 bg-gold mx-auto mt-8" />
        </header>

        <div className="max-w-275 mx-auto w-full">
          <article className="border border-lines bg-surface px-6 py-12 shadow-[0_4px_40px_rgba(0,0,0,0.07)] md:px-24 md:py-20">
            <LegalDocumentMarkdownRenderer content={content} showListMarkers />
          </article>

          <div className="mt-8 flex flex-col items-center gap-2 text-center font-sans text-xs tracking-wide text-charcoal/50">
            <p>
              {dict.privacyPage.lastUpdatedLabel}: {dict.privacyPage.lastUpdated}
            </p>
            <p>
              {dict.privacyPage.contactNote}{' '}
              <a
                href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                className="text-gold hover:opacity-80 transition-opacity"
              >
                {PRIVACY_CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
