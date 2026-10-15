import React from 'react';
import Link from 'next/link';
import ArticleCard, { type ArticleCardData } from '@/components/features/ArticleCard';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

interface ArticlesMosaicSectionProps {
  articulos: ArticleCardData[];
  pinnedArticulos?: ArticleCardData[];
  lang: string;
  dict?: {
    documentTypes?: Record<string, string>;
    readArticle?: string;
    archiveTitle?: string;
    viewAll?: string;
    pinnedTitle?: string;
    [key: string]: unknown;
  };
}

export default function ArticlesMosaicSection({
  articulos,
  pinnedArticulos = [],
  lang,
  dict,
}: ArticlesMosaicSectionProps) {
  if (!articulos || articulos.length === 0) {
    return (
      <section className="w-full py-16 text-center">
        <p className="font-serif text-xl text-charcoal/60">
          {lang === 'es' ? 'No hay publicaciones disponibles en este momento.' : 'Non hai publicacións dispoñibles neste momento.'}
        </p>
      </section>
    );
  }

  // Articles are already sorted by created_at DESC from DAL query
  const leadArticle = articulos[0];
  const secondArticle = articulos[1];
  const thirdArticle = articulos[2];
  const fourthArticle = articulos[3];
  const fifthArticle = articulos[4];
  const remainingArticles = articulos.slice(5);

  const pinnedItems = pinnedArticulos.filter(p => p.id !== leadArticle?.id);

  return (
    <section className="w-full flex flex-col gap-16 md:gap-20">
      {/* ==================================================== */}
      {/* MOSAIC LEVEL 1: HERO SPOTLIGHT + SECONDARY DUO */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main Lead Article (Large 7/12 spotlight) */}
        {leadArticle && (
          <RevealOnScroll className="lg:col-span-7 h-full" delayMs={50}>
            <ArticleCard
              articulo={leadArticle}
              lang={lang}
              dict={dict}
              variant="lead"
              priority={true}
              className="h-full"
            />
          </RevealOnScroll>
        )}

        {/* Secondary Stack (5/12 column with 2 articles) */}
        <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
          {secondArticle && (
            <RevealOnScroll className="flex-1" delayMs={150}>
              <ArticleCard
                articulo={secondArticle}
                lang={lang}
                dict={dict}
                variant="auto"
                className="h-full"
              />
            </RevealOnScroll>
          )}

          {thirdArticle && (
            <RevealOnScroll className="flex-1" delayMs={250}>
              <ArticleCard
                articulo={thirdArticle}
                lang={lang}
                dict={dict}
                variant="auto"
                className="h-full"
              />
            </RevealOnScroll>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* PINNED EDITORIAL ARTICLES (If any exist) */}
      {/* ==================================================== */}
      {pinnedItems.length > 0 && (
        <RevealOnScroll delayMs={100} className="w-full border-y border-lines py-10 my-4 bg-surface/50 -mx-5 px-5 md:-mx-16 md:px-16">
          <div className="max-w-[1120px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gold text-2xl" data-icon="push_pin">
                  push_pin
                </span>
                <h2 className="font-serif text-2xl md:text-3xl text-charcoal">
                  {lang === 'es' ? 'Artículos de Referencia' : 'Artigos de Referencia'}
                </h2>
              </div>
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-charcoal/40">
                {lang === 'es' ? 'Fijados por redacción' : 'Fixados por redacción'}
              </span>
            </div>

            {pinnedItems.length === 1 ? (
              <div className="w-full">
                <ArticleCard
                  articulo={pinnedItems[0]}
                  lang={lang}
                  dict={dict}
                  variant="lead"
                  className="bg-parchment p-6 sm:p-8 border border-lines/80 shadow-sm"
                />
              </div>
            ) : (
              <div className={`grid gap-6 ${
                pinnedItems.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : pinnedItems.length === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              }`}>
                {pinnedItems.map((pinned) => (
                  <ArticleCard
                    key={pinned.id}
                    articulo={pinned}
                    lang={lang}
                    dict={dict}
                    variant="auto"
                    className="bg-parchment p-5 border border-lines/80 shadow-sm"
                  />
                ))}
              </div>
            )}
          </div>
        </RevealOnScroll>
      )}

      {/* ==================================================== */}
      {/* MOSAIC LEVEL 2: ASYMMETRICAL EDITORIAL DUO */}
      {/* ==================================================== */}
      {(fourthArticle || fifthArticle) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {fourthArticle && (
            <RevealOnScroll delayMs={100} className="h-full">
              <ArticleCard
                articulo={fourthArticle}
                lang={lang}
                dict={dict}
                variant="auto"
                className="h-full"
              />
            </RevealOnScroll>
          )}

          {fifthArticle && (
            <RevealOnScroll delayMs={200} className="h-full">
              <ArticleCard
                articulo={fifthArticle}
                lang={lang}
                dict={dict}
                variant="auto"
                className="h-full"
              />
            </RevealOnScroll>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MOSAIC LEVEL 3: 3-COLUMN EDITORIAL MOSAIC GRID */}
      {/* ==================================================== */}
      {remainingArticles.length > 0 && (
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between border-b border-lines pb-4">
            <h3 className="font-serif text-2xl md:text-3xl text-charcoal">
              {lang === 'es' ? 'Más Publicaciones Recientes' : 'Máis Publicacións Recentes'}
            </h3>
            <Link
              href={`/${lang}/articulos`}
              className="text-xs font-bold uppercase tracking-[0.2em] text-gold hover:text-charcoal transition-colors flex items-center gap-1"
            >
              <span>{lang === 'es' ? 'Ver todo el archivo' : 'Ver todo o arquivo'}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {remainingArticles.map((art, idx) => (
              <RevealOnScroll key={art.id} delayMs={(idx % 3) * 120} className="h-full">
                <ArticleCard
                  articulo={art}
                  lang={lang}
                  dict={dict}
                  variant="auto"
                  className="h-full"
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      )}

      {/* Explore Archive CTA button */}
      <RevealOnScroll delayMs={100} className="flex justify-center pt-8">
        <Link
          href={`/${lang}/articulos`}
          className="btn-outline text-xs tracking-[0.2em]"
        >
          {lang === 'es' ? 'Explorar el Archivo Completo' : 'Explorar o Arquivo Completo'}
          <span aria-hidden="true">→</span>
        </Link>
      </RevealOnScroll>
    </section>
  );
}
