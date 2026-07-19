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
            CERNA nace da convicción de que as mellores ideas xorden lonxe do ruído e da urxencia que caracterizan boa parte do debate público actual. Deste xeito, aspiramos a crear un espazo de diálogo e reflexión afastado da demagogia e a polarización.
          </p>
          <p>
            Formamos un grupo de autores que se resisten a encaixar a realidade nunha soa disciplina. Filosofía, economía, dereito, ciencia, literatura e cultura conviven nas nosas páxinas coa mesma naturalidade con que se cruzan na vida cotiá, porque estamos convencidos de que comprender o mundo esixe mirar máis alá dos límites estreitos dunha especialización illada.
          </p>
          <p>
            Escribimos dende a liberdade individual e a responsabilidade que a acompaña, coa honestidade intelectual e o rigor como únicas fronteiras. Máis que unha asociación, CERNA quere ser un espazo de encontro: unha comunidade de pensamento irrestricto, coa única limitación do respecto polo pensamento alleo.
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
