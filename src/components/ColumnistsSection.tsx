import React from 'react';
import Image from 'next/image';
import { DEFAULT_AVATAR_URL, SITE_NAME } from '@/lib/constants';

const columnists = [
  {
    name: 'Diego Araujo',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    email: 'diego@eldialecto.com',
    twitter: '@diego_araujo',
    instagram: '@diego.araujo'
  },
  {
    name: 'Hector Gonzalez',
    description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
    email: 'hector@eldialecto.com',
    twitter: '@hector_gonz',
    instagram: '@hector.g'
  },
  {
    name: 'Denis Fernandez',
    description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.',
    email: 'denis@eldialecto.com',
    twitter: '@denis_fern',
    instagram: '@denis.f'
  },
  {
    name: 'Anxo Perez',
    description: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
    email: 'anxo@eldialecto.com',
    twitter: '@anxo_perez',
    instagram: '@anxo.p'
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
              <div className="relative w-40 h-40 mb-8 rounded-full overflow-hidden border border-lines grayscale group-hover:grayscale-0 transition-all duration-700 cursor-default">
                <Image
                  src={DEFAULT_AVATAR_URL}
                  alt={`Retrato de ${columnist.name}`}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
              
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

              {/* Description visible directly below social links */}
              <p className="font-sans text-sm text-charcoal/70 text-center leading-relaxed mt-6 max-w-[240px]">
                {columnist.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
