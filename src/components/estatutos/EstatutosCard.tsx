import React from 'react';
import Link from 'next/link';

interface EstatutosCardProps {
  lang: string;
  title: string;
  description: string;
  readMoreText: string;
}

export function EstatutosCard({ lang, title, description, readMoreText }: EstatutosCardProps) {
  return (
    <section aria-labelledby="estatutos-title" className="mt-16">
      <Link 
        href={`/${lang}/asociacion/estatutos`}
        className="group flex flex-col md:flex-row md:items-center justify-between p-8 md:p-12 bg-surface border border-lines hover:border-gold transition-all duration-300 hover:shadow-md relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <div className="relative z-10 md:pr-8 mb-6 md:mb-0 text-center md:text-left flex-1">
          <h3 id="estatutos-title" className="font-serif text-3xl md:text-4xl text-charcoal group-hover:text-gold transition-colors mb-4">
            {title}
          </h3>
          <p className="font-sans text-charcoal/80 md:text-lg max-w-2xl mx-auto md:mx-0">
            {description}
          </p>
        </div>
        
        <div className="relative z-10 flex-shrink-0 flex items-center justify-center md:justify-end text-gold font-sans text-sm font-semibold uppercase tracking-wider group-hover:translate-x-2 transition-transform duration-300">
          <span>{readMoreText}</span>
          <span className="material-symbols-outlined ml-2 text-[20px]" aria-hidden="true">arrow_forward</span>
        </div>

        <div className="absolute -bottom-16 -right-16 md:-top-16 md:-right-16 w-40 h-40 bg-gold/5 rounded-full z-0 group-hover:scale-150 transition-transform duration-700 ease-out" aria-hidden="true"></div>
      </Link>
    </section>
  );
}
