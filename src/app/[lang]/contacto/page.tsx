import React from 'react';
import type { Metadata } from 'next';
import ContactForm from '@/components/forms/ContactForm';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';

export const revalidate = 60;

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return {
    title: `${dict.contactoPage.title} | Cerna Pensamento`,
    description: dict.contactoPage.description,
  };
}

export default async function ContactoPage({ params }: Props) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang as Locale);

  return (
    <main className="flex-grow min-h-screen bg-parchment pt-8 sm:pt-12 pb-24">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        
        {/* Page Header */}
        <RevealOnScroll delayMs={50}>
          <header className="text-center mb-10 sm:mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                {dict.contactoPage.eyebrow}
              </span>
              <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-charcoal font-bold tracking-tight mb-5">
              {dict.contactoPage.title}
            </h1>
            <p className="font-sans text-base sm:text-lg text-charcoal/75 max-w-2xl mx-auto leading-relaxed">
              {dict.contactoPage.description}
            </p>
          </header>
        </RevealOnScroll>

        {/* Central Contact Form — Heroic Editorial Container */}
        <RevealOnScroll delayMs={100}>
          <ContactForm dict={dict.contactForm} lang={lang} />
        </RevealOnScroll>

        {/* Direct Email Auxiliary Note Below Form */}
        <RevealOnScroll delayMs={150}>
          <div className="mt-10 text-center text-xs font-sans text-charcoal/60">
            <span>
              {dict.contactoPage.directEmailPrompt}{' '}
            </span>
            <a
              href="mailto:contacto@cernapensamento.org"
              className="font-mono font-semibold text-charcoal hover:text-gold transition-colors underline underline-offset-4 ml-1"
            >
              contacto@cernapensamento.org
            </a>
          </div>
        </RevealOnScroll>

      </div>
    </main>
  );
}
