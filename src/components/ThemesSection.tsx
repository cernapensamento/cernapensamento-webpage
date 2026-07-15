import React from 'react';
import Link from 'next/link';

export default function ThemesSection() {
  const tematicas = [
    'Economía y Capitalismo',
    'Historia y Memoria',
    'Física y Cosmología',
    'Derecho y Justicia',
    'Literatura Contemporánea',
    'Crítica Social'
  ];

  return (
    <section className="w-full py-24 bg-parchment text-charcoal border-t border-lines">
      <div className="max-w-[1000px] mx-auto px-5 md:px-0 text-center">
        <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">Variedad Temática</span>
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-10 leading-tight">
          Un abanico de perspectivas para un mundo complejo
        </h2>
        
        <p className="font-sans text-lg text-charcoal/80 leading-relaxed max-w-2xl mx-auto mb-16">
          Creemos firmemente que la realidad no puede entenderse desde una única disciplina. Nuestros autores cruzan las fronteras del conocimiento empírico y humanístico para ofrecer reflexiones pausadas y transversales.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {tematicas.map((tema) => (
            <span key={tema} className="px-6 py-3 border border-lines text-charcoal/80 font-sans text-xs uppercase tracking-[0.15em] hover:border-gold hover:text-gold transition-colors duration-300 cursor-default">
              {tema}
            </span>
          ))}
        </div>

        <Link 
          href="/articulos" 
          className="inline-block px-8 py-4 border border-charcoal text-charcoal hover:bg-charcoal hover:text-parchment font-sans text-xs uppercase tracking-[0.2em] transition-all duration-300"
        >
          Explorar el archivo de artículos
        </Link>
      </div>
    </section>
  );
}
