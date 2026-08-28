import React from 'react';
import { getDocument } from '@/lib/content';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const { data, content } = getDocument('coleccion-poesia', lang);
  
  const { title, responsable, correo, documento } = data;

  return (
    <main className="min-h-screen bg-parchment py-12 md:py-24 px-5">
      <article className="max-w-[1100px] mx-auto w-full bg-surface border border-lines shadow-[0_4px_40px_rgba(0,0,0,0.07)] px-8 py-16 md:px-24 md:py-20">
        <header className="mb-12 border-b border-lines pb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold font-serif text-charcoal mb-4 leading-tight">
            {title}
          </h1>
          <div className="flex flex-col items-center justify-center gap-2 mt-6">
            <p className="font-medium font-sans text-charcoal/70 uppercase tracking-widest text-xs md:text-sm">
              {responsable}
            </p>
            {correo && (
              <a href={`mailto:${correo.replace('Correo de correo: ', '').replace('Correo: ', '')}`} className="font-medium font-sans text-gold hover:opacity-80 transition-opacity">
                {correo}
              </a>
            )}
            {documento && (
              <p className="mt-2 text-sm text-charcoal/60 italic">{documento}</p>
            )}
          </div>
        </header>

        <MarkdownRenderer content={content} />
      </article>
    </main>
  );
}
