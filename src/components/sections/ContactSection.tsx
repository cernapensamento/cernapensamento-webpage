import React from 'react';
import Link from 'next/link';

export interface ContactDict {
  tag?: string;
  title?: string;
  description?: string;
  button?: string;
  emailLabel?: string;
  email?: string;
}

interface ContactSectionProps {
  lang: string;
  dict?: ContactDict;
}

export default function ContactSection({ lang, dict }: ContactSectionProps) {
  if (!dict) return null;

  return (
    <section 
      aria-label="Contacto e colaboración"
      className="w-full bg-surface border-t border-lines py-16 sm:py-24 px-5 md:px-16 transition-colors"
    >
      <div className="max-w-[1120px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
        
        {/* Left Headline & Description */}
        <div className="max-w-2xl">
          {dict.tag && (
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] block mb-3">
              {dict.tag}
            </span>
          )}
          {dict.title && (
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal font-bold tracking-tight leading-tight mb-4">
              {dict.title}
            </h2>
          )}
          {dict.description && (
            <p className="font-sans text-base sm:text-lg text-charcoal/75 leading-relaxed max-w-xl">
              {dict.description}
            </p>
          )}
        </div>

        {/* Right Action Button & Secondary Contact */}
        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
          <Link
            href={`/${lang}/contacto`}
            className="btn-primary text-xs tracking-[0.15em] font-bold"
          >
            <span>{dict.button}</span>
            <span aria-hidden="true">→</span>
          </Link>
          <a
            href={`mailto:${dict.email || 'contacto@cernapensamento.org'}`}
            className="text-xs text-charcoal/65 hover:text-charcoal underline underline-offset-4 transition-colors font-sans"
          >
            {dict.emailLabel ? `${dict.emailLabel} ${dict.email || 'contacto@cernapensamento.org'}` : 'contacto@cernapensamento.org'}
          </a>
        </div>

      </div>
    </section>
  );
}
