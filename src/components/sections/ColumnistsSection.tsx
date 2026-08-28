import React from 'react';
import Image from 'next/image';

import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

const columnists = [
  {
    id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
    slug: 'diego-araujo',
    name: 'Diego Araújo',
    email: 'diegoaraujo@cernapensamento.org',
    instagram: '@diegoaraujorodriguez_',
    image: '/images/columnistas/diego.jpeg'
  },
  {
    id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
    slug: 'hector-gonzalez',
    name: 'Héctor González',
    email: 'hectorgonzalez@cernapensamento.org',
    instagram: '@hector.gonzalezzz_',
    image: '/images/columnistas/hector.jpeg'
  },
  {
    id: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
    slug: 'denis-fernandez',
    name: 'Denís Fernández',
    email: 'denisfernandez@cernapensamento.org',
    instagram: '@denisfdeez',
    image: '/images/columnistas/denis.jpeg'
  },
  {
    id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    slug: 'anxo-perez',
    name: 'Anxo Pérez',
    email: 'anxoperez@cernapensamento.org',
    instagram: '@anxoperezprego',
    image: '/images/columnistas/anxo.jpeg'
  }
];

interface ColumnistsSectionProps {
  lang: string;
  dict: {
    columnists: {
      tag: string;
      title: string;
      publishedArticles: string;
    };
    authors: Record<string, string>;
  };
}

export default function ColumnistsSection({ lang, dict }: ColumnistsSectionProps) {
  return (
    <section className="w-full border-t border-lines py-24 bg-surface">
      <div className="max-w-[1120px] mx-auto px-5 md:px-16">
        <div className="text-center mb-20">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-4">{dict.columnists.tag}</span>
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal">{dict.columnists.title} {SITE_NAME}</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {columnists.map((columnist) => (
            <div key={columnist.id} className="flex flex-col items-center group">
              <Link href={`/${lang}/autor/${columnist.slug || columnist.id}`} className="relative w-56 h-56 md:w-40 md:h-40 mb-8 rounded-full overflow-hidden border border-lines transition-all duration-700 cursor-pointer block">
                <Image
                  src={columnist.image}
                  alt={`Retrato de ${columnist.name}`}
                  fill
                  className="object-cover transition-all duration-700"
                  sizes="(max-width: 768px) 224px, 160px"
                  unoptimized
                />
              </Link>
              
              <Link href={`/${lang}/autor/${columnist.slug || columnist.id}`}><h3 className="font-serif text-3xl md:text-2xl text-charcoal hover:text-gold transition-colors duration-300 mb-4 text-center px-4">{columnist.name}</h3></Link>
              <div className="w-8 h-[1px] bg-gold mb-6 transition-all duration-500 group-hover:w-16"></div>
              
              <div className="flex flex-col gap-4 md:gap-3 w-full items-center">
                <a href={`mailto:${columnist.email}`} className="text-charcoal/60 hover:text-gold transition-colors flex items-center gap-3 font-sans text-sm md:text-xs uppercase tracking-widest w-full justify-center max-w-[280px] md:max-w-[240px]" aria-label={`Enviar correo a ${columnist.name}`}>
                  <span className="material-symbols-outlined text-[20px] md:text-[18px]" data-icon="mail">mail</span>
                  <span className="truncate">CORREO</span>
                </a>

                <a href={`https://instagram.com/${columnist.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-charcoal/60 hover:text-gold transition-colors flex items-center gap-3 font-sans text-sm md:text-xs uppercase tracking-widest w-full justify-center max-w-[280px] md:max-w-[240px]" aria-label={`Perfil de Instagram de ${columnist.name}`}>
                  <span className="material-symbols-outlined text-[20px] md:text-[18px]">photo_camera</span>
                  <span>Instagram</span>
                </a>
              </div>

              <p className="font-sans text-base md:text-sm text-charcoal/70 text-center leading-relaxed mt-6 max-w-[320px] md:max-w-[240px] px-2">
                {dict.authors[columnist.slug] || ''}
              </p>
              <Link href={`/${lang}/autor/${columnist.slug || columnist.id}`} className="mt-8 md:mt-6 px-6 md:px-4 py-3 md:py-2 border border-charcoal/30 text-charcoal/60 hover:text-parchment hover:bg-charcoal hover:border-charcoal text-xs md:text-[10px] font-sans uppercase tracking-widest transition-all duration-300 cursor-pointer block text-center">
                {dict.columnists.publishedArticles}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
