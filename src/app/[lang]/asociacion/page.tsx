import React from 'react';
import Link from 'next/link';
import { Locale } from '@/i18n-config';
import { getDictionary } from '@/dictionaries';
import { EstatutosCard } from '@/components/estatutos/EstatutosCard';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

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
    <main className="min-h-screen bg-parchment pt-8 sm:pt-12 pb-24 px-5">
      <div className="max-w-[1100px] mx-auto w-full">
        
        {/* ============================================================ */}
        {/* PAGE HERO HEADER */}
        {/* ============================================================ */}
        <header className="mb-12 sm:mb-16 text-center max-w-4xl mx-auto">
          <RevealOnScroll delayMs={50}>
            <span className="text-xs font-bold text-gold uppercase tracking-[0.22em] block mb-3">
              {dict.asociacion.tag}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-serif text-charcoal mb-6 leading-tight">
              {mdTitle}
            </h1>
            <div className="w-16 h-[2px] bg-gold mx-auto mt-6" aria-hidden="true" />
          </RevealOnScroll>
        </header>

        {/* ============================================================ */}
        {/* SECTION 1: #manifesto — INTRO, ORIXE & AGORA */}
        {/* ============================================================ */}
        <section id="manifesto" aria-labelledby="manifesto-title" className="mb-24 scroll-mt-32">
          <div className="flex flex-col max-w-3xl mx-auto">
            
            {/* Section Tag */}
            <RevealOnScroll delayMs={50}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
                <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                  {dict.asociacion.sectionManifesto}
                </span>
              </div>
            </RevealOnScroll>

            {/* Intro Paragraphs */}
            <div className="bg-surface/50 border border-lines p-8 sm:p-12 mb-12 shadow-sm">
              {introParagraphs.map((text, idx) => (
                <RevealOnScroll key={idx} delayMs={100 + idx * 50}>
                  <p className="text-justify leading-relaxed font-sans text-charcoal/90 text-lg md:text-xl mb-6 last:mb-0 whitespace-pre-wrap">
                    {text}
                  </p>
                </RevealOnScroll>
              ))}
            </div>

            {/* Origen & Filosofía */}
            <RevealOnScroll delayMs={100}>
              <h2 id="origen-title" className="text-2xl md:text-4xl font-semibold mb-6 mt-8 font-serif text-charcoal">
                {origen.title}
              </h2>
            </RevealOnScroll>

            <div className="space-y-6 mb-12">
              {origen.paragraphs.map((text, idx) => (
                <RevealOnScroll key={idx} delayMs={150 + idx * 50}>
                  <p className="text-justify leading-relaxed font-sans text-charcoal/85 text-lg md:text-xl whitespace-pre-wrap">
                    {text}
                  </p>
                </RevealOnScroll>
              ))}
            </div>

            {/* Agora de Cerna */}
            <RevealOnScroll delayMs={100}>
              <h2 id="agora-title" className="text-2xl md:text-4xl font-semibold mb-6 mt-8 font-serif text-charcoal">
                {agora.title}
              </h2>
            </RevealOnScroll>

            <RevealOnScroll delayMs={150}>
              <p className="text-justify leading-relaxed font-sans text-charcoal/85 text-lg md:text-xl mb-8 whitespace-pre-wrap">
                {agora.intro}
              </p>
            </RevealOnScroll>

            {/* Modalities Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {agora.modalities.map((mod, idx) => (
                <RevealOnScroll key={idx} delayMs={200 + idx * 60}>
                  <div className="bg-surface border border-lines p-6 h-full flex flex-col justify-between">
                    <span className="font-mono text-xs font-bold text-gold mb-2 block">0{idx + 1}</span>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-charcoal mb-2">
                        {mod.name}
                      </h3>
                      <p className="font-sans text-sm text-charcoal/75 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>

            <RevealOnScroll delayMs={200}>
              <p className="text-justify leading-relaxed font-sans text-charcoal/85 text-lg md:text-xl mb-6 whitespace-pre-wrap">
                {agora.outro}
              </p>
            </RevealOnScroll>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: #coleccions — PROXECTO EDITORIAL */}
        {/* ============================================================ */}
        <section id="coleccions" aria-labelledby="editorial-title" className="my-24 py-16 border-t border-b border-lines scroll-mt-32">
          <header className="mb-14 text-center max-w-3xl mx-auto">
            <RevealOnScroll delayMs={50}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
                <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                  {dict.asociacion.sectionCollections}
                </span>
                <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
              </div>
              <h2 id="editorial-title" className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal mb-4 font-bold">
                {edTitle}
              </h2>
              <p className="font-sans text-base sm:text-lg text-charcoal/75 max-w-2xl mx-auto">
                {edDesc}
              </p>
            </RevealOnScroll>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {collections.map((col: { id: string | number; title: string; description: string }, idx: number) => (
              <RevealOnScroll key={idx} delayMs={100 + (idx % 2) * 100}>
                <Link 
                  href={`/${lang}/asociacion/coleccion-${col.id}`}
                  className="group flex flex-col p-8 sm:p-10 bg-surface border border-lines hover:border-gold transition-all duration-300 hover:shadow-md relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold h-full justify-between"
                >
                  <div className="relative z-10">
                    <span className="font-mono text-xs font-bold text-gold mb-3 block">
                      COL. {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-serif text-2xl md:text-3xl text-charcoal group-hover:text-gold transition-colors mb-3 leading-snug">
                      {col.title}
                    </h3>
                    <p className="font-sans text-charcoal/75 text-sm sm:text-base leading-relaxed">
                      {col.description}
                    </p>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-lines/50 flex items-center justify-between text-gold font-sans text-xs font-bold uppercase tracking-widest relative z-10 group-hover:text-charcoal transition-colors">
                    <span>{readMore}</span>
                    <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                      arrow_forward
                    </span>
                  </div>

                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold/5 rounded-full z-0 group-hover:scale-150 transition-transform duration-700 ease-out" aria-hidden="true" />
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: #actividades — TORNEO DE DEBATE & SÚMATE */}
        {/* ============================================================ */}
        <section id="actividades" aria-labelledby="torneo-title" className="mt-20 mb-24 scroll-mt-32">
          <div className="flex flex-col max-w-3xl mx-auto">
            
            <RevealOnScroll delayMs={50}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
                <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                  {dict.asociacion.sectionInitiatives}
                </span>
              </div>
              <h2 id="torneo-title" className="text-2xl md:text-4xl font-semibold mb-6 font-serif text-charcoal">
                {torneo.title}
              </h2>
            </RevealOnScroll>

            <div className="space-y-6 mb-16">
              {torneo.paragraphs.map((text, idx) => (
                <RevealOnScroll key={idx} delayMs={100 + idx * 50}>
                  <p className="text-justify leading-relaxed font-sans text-charcoal/85 text-lg md:text-xl whitespace-pre-wrap">
                    {text}
                  </p>
                </RevealOnScroll>
              ))}
            </div>

            {/* Súmate Card */}
            <RevealOnScroll delayMs={100}>
              <div className="bg-surface border border-lines p-8 sm:p-12 relative overflow-hidden">
                <h2 id="sumate-title" className="text-2xl md:text-3xl font-semibold mb-6 font-serif text-charcoal">
                  {sumate.title}
                </h2>
                <div className="space-y-4 mb-8">
                  {sumate.paragraphs.map((text, idx) => (
                    <p key={idx} className="text-justify leading-relaxed font-sans text-charcoal/80 text-base sm:text-lg whitespace-pre-wrap">
                      {text}
                    </p>
                  ))}
                </div>

                <Link
                  href={`/${lang}/contacto`}
                  className="btn-primary text-xs tracking-[0.16em] font-bold inline-flex items-center gap-2.5 group shadow-sm"
                >
                  <span>{dict.asociacion.joinButton}</span>
                  <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: #estatutos — ESTATUTOS CARD (WITH SCROLL REVEAL) */}
        {/* ============================================================ */}
        {estatutosCard && (
          <EstatutosCard 
            lang={lang}
            title={estatutosCard.title}
            description={estatutosCard.description}
            readMoreText={readMore}
            legalFramework={dict.asociacion.legalFramework}
          />
        )}
      </div>
    </main>
  );
}
