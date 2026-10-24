'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQDict {
  tag: string;
  title: string;
  description: string;
  items: FAQItem[];
  moreQuestions?: string;
  contactUs?: string;
  statutesLink?: string;
}

interface FAQSectionProps {
  dict: FAQDict;
  lang: string;
}

export default function FAQSection({ dict, lang }: FAQSectionProps) {
  // Keep first item open by default for immediate discoverability
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  if (!dict || !dict.items || dict.items.length === 0) {
    return null;
  }

  return (
    <section 
      aria-labelledby="faq-heading"
      className="w-full py-20 sm:py-28 bg-parchment border-t border-lines relative overflow-hidden"
    >
      {/* Decorative literary watermark */}
      <span 
        aria-hidden="true" 
        className="absolute -right-8 -bottom-10 text-[180px] md:text-[240px] font-serif text-charcoal/[0.03] dark:text-parchment/[0.03] select-none pointer-events-none leading-none"
      >
        ?
      </span>

      <div className="max-w-[1120px] mx-auto px-5 md:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-14 md:mb-18">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-[2px] bg-gold" aria-hidden="true" />
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
              {dict.tag}
            </span>
          </div>

          <h2 
            id="faq-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal font-bold tracking-tight leading-tight mb-5"
          >
            {dict.title}
          </h2>

          <p className="font-sans text-base sm:text-lg text-charcoal/70 leading-relaxed">
            {dict.description}
          </p>
        </div>

        {/* Accordion List */}
        <div className="divide-y divide-lines border-y border-lines">
          {dict.items.map((item, idx) => {
            const isOpen = openIndex === idx;
            const itemNumber = String(idx + 1).padStart(2, '0');
            const panelId = `faq-panel-${idx}`;
            const buttonId = `faq-button-${idx}`;

            return (
              <div key={idx} className="group transition-colors duration-200">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleItem(idx)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full py-7 sm:py-8 flex items-start justify-between gap-6 text-left transition-colors"
                  >
                    <div className="flex items-start gap-4 sm:gap-6">
                      <span className="font-mono text-xs sm:text-sm font-bold text-gold pt-1 select-none">
                        {itemNumber}
                      </span>
                      <span className="font-serif text-xl sm:text-2xl text-charcoal group-hover:text-gold transition-colors font-semibold leading-snug">
                        {item.question}
                      </span>
                    </div>

                    <div 
                      className={`w-8 h-8 rounded-none border border-lines flex items-center justify-center shrink-0 text-charcoal/70 group-hover:border-gold group-hover:text-gold transition-all duration-300 ${
                        isOpen ? 'bg-lines/40 rotate-180 text-gold' : 'bg-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        expand_more
                      </span>
                    </div>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100 pb-8 sm:pb-9' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pl-8 sm:pl-12 pr-4 sm:pr-14">
                    <p className="font-sans text-base sm:text-lg text-charcoal/80 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footnote / Further Assistance */}
        {dict.moreQuestions && (
          <div className="mt-12 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans text-charcoal/65">
            <span>{dict.moreQuestions}</span>
            <div className="flex items-center gap-4">
              <Link
                href={`/${lang}/contacto`}
                className="font-bold text-charcoal hover:text-gold underline underline-offset-4 uppercase tracking-wider transition-colors"
              >
                {dict.contactUs || 'contacto@cernapensamento.org'}
              </Link>
              <span aria-hidden="true" className="text-lines">|</span>
              <Link
                href={`/${lang}/asociacion/estatutos`}
                className="font-bold text-charcoal/70 hover:text-gold uppercase tracking-wider transition-colors"
              >
                {dict.statutesLink}
              </Link>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
