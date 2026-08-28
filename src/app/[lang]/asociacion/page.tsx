import React from 'react';
import Link from 'next/link';
import { Locale } from '@/i18n-config';
import { getDictionary } from '@/dictionaries';
import { EstatutosCard } from '@/components/estatutos/EstatutosCard';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function AsociacionPage({ params }: Props) {
  const { lang } = await params;
  const typedLang = lang as Locale;
  const dict = await getDictionary(typedLang);
  
  const { 
    title: mdTitle, 
    introParagraphs, 
    origen, 
    agora, 
    torneo, 
    sumate 
  } = dict.asociacion;
  
  const { 
    title: edTitle, 
    description: edDesc, 
    readMore, 
    collections, 
    estatutosCard 
  } = dict.editorial.hub;

  return (
    <main className="min-h-screen bg-parchment py-16 md:py-24 px-5">
      <div className="max-w-[1100px] mx-auto w-full">
        
        <header className="mb-16 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold font-serif text-charcoal mb-4 leading-tight">
            {mdTitle}
          </h1>
          <div className="w-16 h-[2px] bg-gold mx-auto mt-8" aria-hidden="true" />
        </header>

        {/* Intro & Origen & Agora */}
        <section aria-labelledby="origen-title" className="mb-20">
          <div className="flex flex-col max-w-3xl mx-auto">
            {introParagraphs.map((text, idx) => (
              <p key={idx} className="text-justify leading-relaxed font-sans text-charcoal/90 text-lg md:text-xl mb-6 whitespace-pre-wrap">
                {text}
              </p>
            ))}

            <h2 id="origen-title" className="text-2xl md:text-3xl font-semibold mb-6 mt-12 font-serif text-charcoal">
              {origen.title}
            </h2>
            {origen.paragraphs.map((text, idx) => (
              <p key={idx} className="text-justify leading-relaxed font-sans text-charcoal/90 text-lg md:text-xl mb-6 whitespace-pre-wrap">
                {text}
              </p>
            ))}

            <h2 id="agora-title" className="text-2xl md:text-3xl font-semibold mb-6 mt-12 font-serif text-charcoal">
              {agora.title}
            </h2>
            <p className="text-justify leading-relaxed font-sans text-charcoal/90 text-lg md:text-xl mb-6 whitespace-pre-wrap">
              {agora.intro}
            </p>
            <ul className="list-disc pl-6 mb-6 text-charcoal/90 text-lg md:text-xl leading-relaxed">
              {agora.modalities.map((mod, idx) => (
                <li key={idx} className="mb-3">
                  <strong className="font-semibold text-charcoal">{mod.name}: </strong>
                  {mod.desc}
                </li>
              ))}
            </ul>
            <p className="text-justify leading-relaxed font-sans text-charcoal/90 text-lg md:text-xl mb-6 whitespace-pre-wrap">
              {agora.outro}
            </p>
          </div>
        </section>

        {/* Existing Proyecto Editorial section */}
        <section aria-labelledby="editorial-title" className="my-24">
          <header className="mb-12 text-center max-w-3xl mx-auto">
            <h2 id="editorial-title" className="font-serif text-3xl md:text-5xl text-charcoal mb-6">
              {edTitle}
            </h2>
            <p className="font-sans text-lg text-charcoal/80">
              {edDesc}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {collections.map((col: { id: string | number; title: string; description: string }, idx: number) => (
              <Link 
                key={idx} 
                href={`/${lang}/asociacion/coleccion-${col.id}`}
                className="group flex flex-col p-8 md:p-10 bg-surface border border-lines hover:border-gold transition-all duration-300 hover:shadow-sm relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <h3 className="font-serif text-2xl md:text-3xl text-charcoal group-hover:text-gold transition-colors mb-4 relative z-10">
                  {col.title}
                </h3>
                <p className="font-sans text-charcoal/80 md:text-lg relative z-10 flex-1">
                  {col.description}
                </p>
                
                <div className="mt-8 flex items-center text-gold font-sans text-sm font-semibold uppercase tracking-wider relative z-10 group-hover:translate-x-2 transition-transform duration-300">
                  <span>{readMore}</span>
                  <span className="material-symbols-outlined ml-2 text-[18px]" aria-hidden="true">arrow_forward</span>
                </div>

                <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold/5 rounded-full z-0 group-hover:scale-150 transition-transform duration-700 ease-out" aria-hidden="true"></div>
              </Link>
            ))}
          </div>
        </section>

        {/* Torneo & Sumate */}
        <section aria-labelledby="torneo-title" className="mt-20 mb-24">
          <div className="flex flex-col max-w-3xl mx-auto">
            <h2 id="torneo-title" className="text-2xl md:text-3xl font-semibold mb-6 mt-12 font-serif text-charcoal">
              {torneo.title}
            </h2>
            {torneo.paragraphs.map((text, idx) => (
              <p key={idx} className="text-justify leading-relaxed font-sans text-charcoal/90 text-lg md:text-xl mb-6 whitespace-pre-wrap">
                {text}
              </p>
            ))}

            <h2 id="sumate-title" className="text-2xl md:text-3xl font-semibold mb-6 mt-12 font-serif text-charcoal">
              {sumate.title}
            </h2>
            {sumate.paragraphs.map((text, idx) => (
              <p key={idx} className="text-justify leading-relaxed font-sans text-charcoal/90 text-lg md:text-xl mb-6 whitespace-pre-wrap">
                {text}
              </p>
            ))}
          </div>
        </section>

        {/* Estatutos Card */}
        {estatutosCard && (
          <EstatutosCard 
            lang={lang}
            title={estatutosCard.title}
            description={estatutosCard.description}
            readMoreText={readMore}
          />
        )}
      </div>
    </main>
  );
}
