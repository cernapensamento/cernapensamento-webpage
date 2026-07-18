import React from 'react';
import { SITE_NAME } from '@/lib/constants';

export default function ContactSection() {
  return (
    <section className="w-full py-24 bg-charcoal dark:bg-parchment relative overflow-hidden">
      
      <div className="max-w-[800px] mx-auto px-5 md:px-16 text-center flex flex-col items-center">
        <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-4">Contacto</span>
        <h2 className="font-serif text-4xl md:text-5xl text-parchment dark:text-charcoal mb-8">Falemos</h2>
        
        <p className="font-sans text-lg text-parchment/70 dark:text-charcoal/70 leading-relaxed mb-12 max-w-2xl">
          Tes algunha proposta, dúbida ou desexas colaborar con {SITE_NAME}? 
          Encantaríanos escoitar as túas ideas. Escríbenos directamente á nosa caixa de correo e poñerémonos en contacto contigo.
        </p>

        <a 
          href="mailto:contacto@cernapensamento.org" 
          className="group relative inline-flex items-center justify-center gap-4 px-8 py-5 bg-parchment dark:bg-charcoal text-charcoal dark:text-parchment font-sans text-sm md:text-base uppercase tracking-[0.2em] transition-all duration-500 hover:bg-gold dark:hover:bg-gold hover:text-charcoal dark:hover:text-parchment shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-[24px] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">mail</span>
          <span>CORREO</span>
        </a>
        
      </div>
    </section>
  );
}
