import React from 'react';
import Link from 'next/link';

export default function AboutUsSection() {
  return (
    <section className="w-full border-t border-lines py-24 bg-surface">
      <div className="max-w-[800px] mx-auto px-5 md:px-0 text-center">
        <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">Quiénes Somos</span>
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-10 leading-tight">
          Un espacio de reflexión crítica y pensamiento libre
        </h2>
        
        <div className="space-y-6 font-sans text-base text-charcoal/80 leading-relaxed mb-12 text-left">
          <p className="first-letter:float-left first-letter:font-serif first-letter:text-7xl first-letter:text-gold first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8]">
            CERNA nace con la convicción de que el pensamiento crítico y el análisis pausado son herramientas imprescindibles para comprender nuestra realidad. Nuestra publicación aspira a contribuir a la formación de un espacio estable de reflexión, huyendo de la inmediatez que caracteriza gran parte de los debates contemporáneos.
          </p>
          <p>
            Reunimos a un grupo de autores comprometidos con el rigor intelectual y el cuidado de la expresión, convencidos de que las mejores ideas son aquellas que invitan al diálogo y abren nuevas vías de pensamiento en lugar de cerrar discusiones.
          </p>
          <p>
            La excelencia editorial, la independencia de criterio y la defensa de la lengua y la cultura gallega constituyen nuestros pilares. Más allá del volumen o la frecuencia de publicación, nuestra principal aspiración es forjar una comunidad de lectores exigentes que compartan nuestro gusto por las ideas bien argumentadas.
          </p>
        </div>

        <Link 
          href="/bases-editoriales" 
          className="inline-block px-8 py-4 border border-charcoal text-charcoal hover:bg-charcoal hover:text-parchment font-sans text-xs uppercase tracking-[0.15em] transition-colors duration-300"
        >
          Nuestro Proyecto Editorial
        </Link>
      </div>
    </section>
  );
}
