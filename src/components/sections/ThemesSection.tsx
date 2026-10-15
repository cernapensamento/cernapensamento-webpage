import React from 'react';
import Link from 'next/link';

export interface ThemeDossierItem {
  id: string;
  title: string;
  desc: string;
}

interface ThemesSectionProps {
  lang: string;
  dict: {
    tag: string;
    title: string;
    description: string;
    list: string[];
    exploreButton: string;
    items?: ThemeDossierItem[];
  };
}

export default function ThemesSection({ lang, dict }: ThemesSectionProps) {
  if (!dict) return null;

  const items = dict.items || dict.list.map((tema, idx) => ({
    id: String(idx + 1).padStart(2, '0'),
    title: tema,
    desc: lang === 'es' 
      ? 'Análisis profundo, ensayos monográficos y perspectivas de actualidad en esta disciplina.'
      : 'Análise profunda, ensaios monográficos e perspectivas de actualidade nesta disciplina.',
  }));

  return (
    <section 
      aria-labelledby="themes-heading"
      className="w-full py-20 sm:py-28 bg-surface border-t border-lines relative overflow-hidden"
    >
      {/* Decorative literary watermark */}
      <span 
        aria-hidden="true" 
        className="absolute -right-12 -top-12 text-[220px] md:text-[280px] font-serif text-charcoal/[0.03] dark:text-parchment/[0.03] select-none pointer-events-none leading-none"
      >
        ✦
      </span>

      <div className="max-w-[1120px] mx-auto px-5 md:px-16 relative z-10">
        
        {/* Upper Section Header */}
        <div className="max-w-2xl mb-14 md:mb-18">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-[2px] bg-gold" aria-hidden="true" />
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
              {dict.tag}
            </span>
          </div>

          <h2 
            id="themes-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal font-bold tracking-tight leading-tight mb-5"
          >
            {dict.title}
          </h2>

          <p className="font-sans text-base sm:text-lg text-charcoal/70 leading-relaxed">
            {dict.description}
          </p>
        </div>

        {/* Thematic Dossiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/${lang}/articulos?tema=${encodeURIComponent(item.title)}`}
              className="group bg-parchment border border-lines p-7 sm:p-8 flex flex-col justify-between hover:border-gold/60 hover:shadow-sm transition-all duration-300 relative overflow-hidden"
            >
              {/* Top metadata row */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="font-mono text-xs font-bold text-gold tracking-widest select-none">
                    {item.id}
                  </span>
                  <span className="text-charcoal/30 group-hover:text-gold group-hover:translate-x-1 transition-all text-sm" aria-hidden="true">
                    →
                  </span>
                </div>

                {/* Theme Title */}
                <h3 className="font-serif text-2xl text-charcoal group-hover:text-gold transition-colors font-semibold leading-snug mb-3">
                  {item.title}
                </h3>

                {/* Scope Description */}
                <p className="font-sans text-xs sm:text-sm text-charcoal/70 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-6 mt-6 border-t border-lines/50 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal/50 group-hover:text-charcoal transition-colors">
                  {lang === 'es' ? 'Ver publicaciones' : 'Ver publicacións'}
                </span>
                <span className="text-xs font-bold text-gold">
                  §
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA to Full Archive */}
        <div className="mt-16 pt-10 border-t border-lines flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="font-sans text-xs sm:text-sm text-charcoal/60 text-center sm:text-left">
            {lang === 'es' 
              ? '¿Buscas un texto o autor en específico? Utiliza el buscador y los filtros temáticos en el archivo.' 
              : 'Buscas un texto ou autor en específico? Emprega o buscador e os filtros temáticos no arquivo.'}
          </span>
          <Link 
            href={`/${lang}/articulos`} 
            className="btn-outline text-xs tracking-[0.2em] shrink-0"
          >
            <span>{dict.exploreButton}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
