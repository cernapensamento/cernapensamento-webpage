import React from 'react';
import Link from 'next/link';

export default function AboutUsSection() {
  return (
    <section className="w-full border-t border-lines py-24 bg-surface">
      <div className="max-w-[800px] mx-auto px-5 md:px-0 text-center">
        <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">Quen Somos</span>
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-10 leading-tight">
          Un espazo de reflexión crítica e pensamento libre
        </h2>
        
        <div className="space-y-6 font-sans text-base text-charcoal/80 leading-relaxed mb-12 text-left">
          <p className="first-letter:float-left first-letter:font-serif first-letter:text-7xl first-letter:text-gold first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8]">
            CERNA nace coa convicción de que o pensamento crítico e a análise pausada son ferramentas imprescindibles para comprender a nosa realidade. A nosa publicación aspira a contribuír á formación dun espazo estable de reflexión, fuxindo da inmediatez que caracteriza gran parte dos debates contemporáneos.
          </p>
          <p>
            Reunimos a un grupo de autores comprometidos co rigor intelectual e o coidado da expresión, convencidos de que as mellores ideas son aquelas que invitan ao diálogo e abren novas vías de pensamento en lugar de pechar discusións.
          </p>
          <p>
            A excelencia editorial, a independencia de criterio e a defensa da lingua e a cultura galega constitúen os nosos piares. Máis alá do volume ou a frecuencia de publicación, a nosa principal aspiración é forxar unha comunidade de lectores esixentes que compartan o noso gusto polas ideas ben argumentadas.
          </p>
        </div>

        <Link 
          href="/bases-editoriales" 
          className="inline-block px-8 py-4 border border-charcoal text-charcoal hover:bg-charcoal hover:text-parchment font-sans text-xs uppercase tracking-[0.15em] transition-colors duration-300"
        >
          O Noso Proxecto Editorial
        </Link>
      </div>
    </section>
  );
}
