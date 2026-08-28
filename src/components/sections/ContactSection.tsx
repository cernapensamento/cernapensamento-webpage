import React from 'react';
import { SITE_NAME } from '@/lib/constants';

export default function ContactSection({ dict }: { dict: { tag?: string; title?: string; description: string; button?: string } }) {
  return (
    <section className="w-full py-24 bg-parchment border-t border-lines relative overflow-hidden">
      
      <div className="max-w-[800px] mx-auto px-5 md:px-16 text-center flex flex-col items-center">
        <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-4">{dict.tag}</span>
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-8">{dict.title}</h2>
        
        <p className="font-sans text-lg text-charcoal/80 leading-relaxed mb-12 max-w-2xl">
          {dict.description.replace('{site_name}', SITE_NAME)}
        </p>

        <a 
          href="mailto:contacto@cernapensamento.org" 
          className="group relative inline-flex items-center justify-center gap-4 px-8 py-5 bg-charcoal text-parchment font-sans text-sm md:text-base uppercase tracking-[0.2em] transition-all duration-500 hover:bg-gold hover:text-charcoal shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-[24px] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">mail</span>
          <span>{dict.button}</span>
        </a>
        
      </div>
    </section>
  );
}
