import React from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

interface AssociationAndNewsSectionProps {
  lang: string;
}

export default function AssociationAndNewsSection({ lang }: AssociationAndNewsSectionProps) {
  const isEs = lang === 'es';

  return (
    <section className="w-full border-t border-lines py-20 md:py-28 bg-surface/70">
      <div className="max-w-[1120px] mx-auto px-5 md:px-16 flex flex-col gap-16">
        
        {/* Section Header */}
        <RevealOnScroll className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-lines">
          <div>
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] block mb-3">
              {isEs ? 'Institución y Actualidad' : 'Institución e Actualidade'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal leading-tight">
              {isEs ? 'Asociación y Cuaderno de Noticias' : 'A Asociación e Caderno de Novas'}
            </h2>
          </div>
          <p className="font-sans text-sm md:text-base text-charcoal/70 max-w-md">
            {isEs
              ? 'Un proyecto civil independiente comprometido con la difusión de las ideas de la libertad, el ensayo riguroso y la cultura en Galicia.'
              : 'Un proxecto civil independente comprometido coa difusión das ideas da liberdade, o ensaio rigoroso e a cultura en Galicia.'}
          </p>
        </RevealOnScroll>

        {/* Dual Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: Asociación */}
          <RevealOnScroll delayMs={50} className="h-full">
            <div className="bg-parchment border border-lines p-8 sm:p-10 flex flex-col justify-between h-full transition-all duration-300 hover:border-gold/60 hover:shadow-lg relative overflow-hidden group">
              <span 
                aria-hidden="true" 
                className="absolute -right-3 -bottom-8 text-8xl sm:text-9xl font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none font-bold"
              >
                § I
              </span>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-gold inline-block" />
                  <span className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">
                    {isEs ? 'La Asociación Cerna' : 'A Asociación Cerna'}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal mb-4 leading-snug">
                  {isEs ? 'Pensamiento libre, diálogo y sociedad civil' : 'Pensamento libre, diálogo e sociedade civil'}
                </h3>

                <p className="font-sans text-base text-charcoal/75 leading-relaxed mb-8">
                  {isEs
                    ? 'Constituida legalmente en Galicia, Cerna Pensamento articula una comunidad de escritores, investigadores y ciudadanos que defienden el rigor intelectual, la libertad individual y el debate sin tutelas ideológicas.'
                    : 'Constituída legalmente en Galicia, Cerna Pensamento artella unha comunidade de escritores, investigadores e cidadáns que defenden o rigor intelectual, a liberdade individual e o debate sen tutelas ideolóxicas.'}
                </p>

                {/* Sub-links */}
                <div className="flex flex-col gap-3 pt-4 border-t border-lines/70 mb-8">
                  <Link 
                    href={`/${lang}/asociacion`}
                    className="flex items-center justify-between py-2 text-sm text-charcoal/80 hover:text-gold transition-colors font-sans border-b border-lines/40 group/sub"
                  >
                    <span>{isEs ? 'Manifiesto y principios fundacionales' : 'Manifesto e principios fundacionais'}</span>
                    <span className="text-xs transition-transform group-hover/sub:translate-x-1">→</span>
                  </Link>
                  <Link 
                    href={`/${lang}/asociacion/estatutos`}
                    className="flex items-center justify-between py-2 text-sm text-charcoal/80 hover:text-gold transition-colors font-sans border-b border-lines/40 group/sub"
                  >
                    <span>{isEs ? 'Estatutos oficiales de la asociación' : 'Estatutos oficiais da asociación'}</span>
                    <span className="text-xs transition-transform group-hover/sub:translate-x-1">→</span>
                  </Link>
                  <Link 
                    href={`/${lang}/asociacion`}
                    className="flex items-center justify-between py-2 text-sm text-charcoal/80 hover:text-gold transition-colors font-sans group/sub"
                  >
                    <span>{isEs ? 'Estructura y colecciones editoriales' : 'Estrutura e coleccións editoriais'}</span>
                    <span className="text-xs transition-transform group-hover/sub:translate-x-1">→</span>
                  </Link>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <Link
                  href={`/${lang}/asociacion`}
                  className="btn-primary w-full sm:w-auto"
                >
                  <span>{isEs ? 'Conoce la Asociación' : 'Coñece a Asociación'}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </RevealOnScroll>

          {/* Card 2: Noticias */}
          <RevealOnScroll delayMs={150} className="h-full">
            <div className="bg-parchment border border-lines p-8 sm:p-10 flex flex-col justify-between h-full transition-all duration-300 hover:border-gold/60 hover:shadow-lg relative overflow-hidden group">
              <span 
                aria-hidden="true" 
                className="absolute -right-3 -bottom-8 text-8xl sm:text-9xl font-serif text-charcoal/[0.04] dark:text-parchment/[0.04] select-none pointer-events-none font-bold"
              >
                § II
              </span>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-charcoal inline-block" />
                  <span className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">
                    {isEs ? 'Cuaderno de Noticias' : 'Caderno de Novas'}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal mb-4 leading-snug">
                  {isEs ? 'Convocatorias, eventos y vida editorial' : 'Convocatorias, eventos e vida editorial'}
                </h3>

                <p className="font-sans text-base text-charcoal/75 leading-relaxed mb-8">
                  {isEs
                    ? 'Sigue el pulso de nuestras publicaciones, presentaciones de libros, colaboraciones académicas y comunicados institucionales en nuestro canal de noticias y actualidad.'
                    : 'Segue o pulso das nosas publicacións, presentacións de libros, colaboracións académicas e comunicados institucionais na nosa canle de novas e actualidade.'}
                </p>

                {/* News Highlights preview */}
                <div className="flex flex-col gap-3 pt-4 border-t border-lines/70 mb-8">
                  <div className="py-2 border-b border-lines/40">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold block mb-1">
                      {isEs ? 'Editorial' : 'Editorial'}
                    </span>
                    <p className="text-sm text-charcoal/90 font-medium">
                      {isEs ? 'Apertura de la convocatoria de ensayos para el nuevo ciclo editorial' : 'Apertura da convocatoria de ensaios para o novo ciclo editorial'}
                    </p>
                  </div>
                  <div className="py-2 border-b border-lines/40">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold block mb-1">
                      {isEs ? 'Publicación' : 'Publicación'}
                    </span>
                    <p className="text-sm text-charcoal/90 font-medium">
                      {isEs ? 'Disponibles las cuatro colecciones: Ensayo, Poesía, Narrativa y Opinión' : 'Dispoñibles as catro coleccións: Ensaio, Poesía, Narrativa e Opinión'}
                    </p>
                  </div>
                  <div className="py-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold block mb-1">
                      {isEs ? 'Asociación' : 'Asociación'}
                    </span>
                    <p className="text-sm text-charcoal/90 font-medium">
                      {isEs ? 'Publicación del manifiesto y bases de afiliación para socios colaboradores' : 'Publicación do manifesto e bases de afiliación para socios colaboradores'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <Link
                  href={`/${lang}/noticias`}
                  className="btn-outline w-full sm:w-auto"
                >
                  <span>{isEs ? 'Ver todas las Noticias' : 'Ver todas as Novas'}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </RevealOnScroll>

        </div>
      </div>
    </section>
  );
}
