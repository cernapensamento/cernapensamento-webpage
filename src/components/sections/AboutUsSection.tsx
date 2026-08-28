import React from 'react';
import Link from 'next/link';

interface AboutUsSectionProps {
  lang: string;
  dict: {
    title: string;
    subtitle: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    button: string;
  };
}

export default function AboutUsSection({ lang, dict }: AboutUsSectionProps) {
  return (
    <section className="w-full border-t border-lines py-24 bg-surface">
      <div className="max-w-[800px] mx-auto px-5 md:px-0 text-center">
        <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">{dict.title}</span>
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-10 leading-tight">
          {dict.subtitle}
        </h2>
        
        <div className="space-y-6 font-sans text-base text-charcoal/80 leading-relaxed mb-12 text-left">
          <p className="first-letter:float-left first-letter:font-serif first-letter:text-7xl first-letter:text-gold first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8]">
            {dict.paragraph1}
          </p>
          <p>{dict.paragraph2}</p>
          <p>{dict.paragraph3}</p>
        </div>

        <Link 
          href={`/${lang}/asociacion`}
          className="inline-block px-8 py-4 border border-charcoal text-charcoal hover:bg-charcoal hover:text-parchment font-sans text-xs uppercase tracking-[0.15em] transition-colors duration-300"
        >
          {dict.button}
        </Link>
      </div>
    </section>
  );
}
