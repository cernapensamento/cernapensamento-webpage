import React from 'react';
import Link from 'next/link';

const tematicas = [
  'Economía',
  'Filosofía',
  'Literatura',
  'Dereito e Xustiza',
  'Ciencia e Divulgación',
  'Historia',
  'Crítica Social'
];

export default function ThemesSection() {

  return (
    <section className="w-full py-24 bg-parchment text-charcoal border-t border-lines">
      <div className="max-w-[1000px] mx-auto px-5 md:px-0 text-center">
        <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">Variedade Temática</span>
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-10 leading-tight">
          Un abano de perspectivas para un mundo complexo
        </h2>
        
        <p className="font-sans text-lg text-charcoal/80 leading-relaxed max-w-2xl mx-auto mb-16">
          Cremos firmemente que a realidade non pode entenderse desde unha única disciplina. Os nosos autores cruzan as fronteiras do coñecemento empírico e humanístico para ofrecer reflexións pausadas e transversais.
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
          Explorar o arquivo de artigos
        </Link>
      </div>
    </section>
  );
}
