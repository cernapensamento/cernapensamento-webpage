import React from 'react';
import { EstatutosMarkdownRenderer } from '@/components/ui/EstatutosMarkdownRenderer';
import { getDocument } from '@/lib/content';

// Metadatos para SEO
export const metadata = {
  title: 'Estatutos | Asociación Cerna Pensamento',
  description: 'Estatutos oficiales de la Asociación Cerna Pensamento.',
};

export default async function EstatutosPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { content } = getDocument('estatutos', lang);
  
  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      
      
      <main className="px-4 md:px-12 pb-40 pt-16 flex flex-col flex-1">
        {/* Page header */}
        <header className="max-w-[1100px] mx-auto w-full text-center mb-16">
          <p className="font-sans text-[0.65rem] text-gold uppercase tracking-[0.45em] font-semibold mb-5">
            Asociación Cerna Pensamento
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-charcoal mb-0 leading-tight">
            Estatutos
          </h1>
          <div className="w-12 h-[2px] bg-gold mx-auto mt-8" />
        </header>

        {/* Document card */}
        <div className="max-w-[1100px] mx-auto w-full">
          <div className="bg-surface border border-lines shadow-[0_4px_40px_rgba(0,0,0,0.07)] px-8 py-16 md:px-24 md:py-20">
            <EstatutosMarkdownRenderer content={content} />
          </div>
          {/* Bottom meta */}
          <p className="text-center text-xs text-charcoal/40 font-sans mt-8 tracking-wide">
            Documento aprobado en Cambados, 1 de xullo de 2026
          </p>
        </div>
      </main>

    </div>
  );
}
