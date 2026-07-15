import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DEFAULT_AVATAR_URL, SITE_NAME } from '@/lib/constants';

const columnists = [
  {
    id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
    name: 'Diego Araujo',
    description: 'Cursa Economía en la Universidade de Santiago de Compostela. Escribe sobre las contradicciones del capitalismo tardío, la relación entre mercados y poder, y las formas de organización económica alternativas al modelo dominante. Le interesa particularmente la economía ecológica y cree que la economía no puede entenderse sin la historia.',
    email: 'diegoaraujo@cerna.com',
    twitter: '@diego_araujo',
    instagram: '@diego.araujo',
    image: '/images/columnistas/diego.jpeg'
  },
  {
    id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
    name: 'Hector Gonzalez',
    description: 'Estudia Física en la Universidade de Santiago de Compostela. Escribe sobre los límites del conocimiento científico, la naturaleza del tiempo y aquello que la física aún no puede explicar: la conciencia, el libre albedrío, el origen de las leyes naturales. Le apasiona la divulgación científica como puente entre la academia y la calle.',
    email: 'hectorgonzalez@cerna.com',
    twitter: '@hector_gonz',
    instagram: '@hector.g',
    image: '/images/columnistas/hector.jpeg'
  },
  {
    id: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
    name: 'Denis Fernandez',
    description: 'Estudia Derecho en la Universidad Rey Juan Carlos de Madrid. Sus ensayos giran en torno a la tensión entre la ley escrita y la justicia material, los derechos humanos como conquista siempre reversible, y el papel del Estado frente a la desigualdad. Defiende que el derecho debe estar al servicio de los más débiles.',
    email: 'denisfernandez@cerna.com',
    twitter: '@denis_fern',
    instagram: '@denis.f',
    image: '/images/columnistas/denis.jpeg'
  },
  {
    id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    name: 'Anxo Perez',
    description: 'Estudia Humanidades en la Universidad de Navarra. Sus ensayos transitan entre la crítica literaria, la memoria histórica y la pregunta por el sentido en un mundo secularizado. Escribe sobre el silencio como forma de resistencia, la literatura del desarraigo y la poesía de la guerra civil española. Devoto lector de César Vallejo.',
    email: 'anxoperez@cerna.com',
    twitter: '@anxo_perez',
    instagram: '@anxo.p',
    image: '/images/columnistas/anxo.jpeg'
  }
];

export default function ColumnistsSection() {
  return (
    <section className="w-full border-t border-lines py-24 bg-parchment">
      <div className="max-w-[1120px] mx-auto px-5 md:px-16">
        <div className="text-center mb-20">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-4">Nuestro Equipo</span>
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal">Columnistas de {SITE_NAME}</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {columnists.map((columnist, index) => (
            <div key={index} className="flex flex-col items-center group">
              <Link href={`/autor/${columnist.id}`} className="relative w-40 h-40 mb-8 rounded-full overflow-hidden border border-lines grayscale group-hover:grayscale-0 transition-all duration-700 cursor-pointer block">
                <Image
                  src={columnist.image}
                  alt={`Retrato de ${columnist.name}`}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </Link>
              
              <h3 className="font-serif text-2xl text-charcoal mb-4">{columnist.name}</h3>
              <div className="w-8 h-[1px] bg-gold mb-6 transition-all duration-500 group-hover:w-16"></div>
              
              <div className="flex flex-col gap-3 w-full items-center">
                <a href={`mailto:${columnist.email}`} className="text-charcoal/60 hover:text-gold transition-colors flex items-center gap-3 font-sans text-xs lowercase w-full justify-center max-w-[240px]" aria-label={`Enviar correo a ${columnist.name}`}>
                  <span className="material-symbols-outlined text-[18px]" data-icon="mail">mail</span>
                  <span className="truncate">{columnist.email}</span>
                </a>
                <a href={`https://twitter.com/${columnist.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-charcoal/60 hover:text-gold transition-colors flex items-center gap-3 font-sans text-xs uppercase tracking-widest w-full justify-center max-w-[240px]" aria-label={`Perfil de Twitter de ${columnist.name}`}>
                  <span className="material-symbols-outlined text-[18px]">alternate_email</span>
                  <span>Twitter</span>
                </a>
                <a href={`https://instagram.com/${columnist.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-charcoal/60 hover:text-gold transition-colors flex items-center gap-3 font-sans text-xs uppercase tracking-widest w-full justify-center max-w-[240px]" aria-label={`Perfil de Instagram de ${columnist.name}`}>
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  <span>Instagram</span>
                </a>
              </div>

              <p className="font-sans text-sm text-charcoal/70 text-center leading-relaxed mt-6 max-w-[240px]">
                {columnist.description}
              </p>
              <Link href={`/autor/${columnist.id}`} className="mt-6 px-4 py-2 border border-charcoal/30 text-charcoal/60 hover:text-parchment hover:bg-charcoal hover:border-charcoal text-[10px] font-sans uppercase tracking-widest transition-all duration-300 cursor-pointer block text-center">
                Artículos publicados
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
