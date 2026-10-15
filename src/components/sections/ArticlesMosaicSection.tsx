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
    mosaic?: {
      noArticles?: string;
      pinnedTitle?: string;
      pinnedSubtitle?: string;
      recentTitle?: string;
      viewAll?: string;
      exploreAll?: string;
      readArticle?: string;
      by?: string;
    };
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
          {dict?.mosaic?.noArticles || (lang === 'es' ? 'No hay publicaciones disponibles en este momento.' : 'Non hai publicacións dispoñibles neste momento.')}
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
    <section className="w-full flex flex-col gap-14 md:gap-18">
      
      {/* ==================================================== */}
      {/* MOSAIC LEVEL 1: HERO HORIZONTAL SPOTLIGHT (FULL WIDTH) */}
      {/* ==================================================== */}
      {leadArticle && (
        <RevealOnScroll className="w-full" delayMs={50}>
          <ArticleCard
            articulo={leadArticle}
            lang={lang}
            dict={dict}
            variant="lead"
            priority={true}
            className="w-full"
          />
        </RevealOnScroll>
      )}

      {/* ==================================================== */}
      {/* MOSAIC LEVEL 2: SECONDARY EDITORIAL DUO */}
      {/* ==================================================== */}
      {(secondArticle || thirdArticle) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {secondArticle && (
            <RevealOnScroll className="h-full" delayMs={100}>
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
            <RevealOnScroll className="h-full" delayMs={200}>
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
      )}

      {/* ==================================================== */}
      {/* PINNED EDITORIAL ARTICLES (100% GRID ALIGNED) */}
      {/* ==================================================== */}
      {pinnedItems.length > 0 && (
        <RevealOnScroll delayMs={100} className="w-full border-t border-b border-lines py-10 my-2 bg-surface/30">
          <div className="w-full">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-lines/50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gold text-2xl" data-icon="push_pin">
                  push_pin
                </span>
                <h2 className="font-serif text-2xl md:text-3xl text-charcoal font-semibold">
                  {dict?.mosaic?.pinnedTitle || (lang === 'es' ? 'Artículos de Referencia' : 'Artigos de Referencia')}
                </h2>
              </div>
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-charcoal/40">
                {dict?.mosaic?.pinnedSubtitle || (lang === 'es' ? 'Fijados por redacción' : 'Fixados por redacción')}
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
      {/* MOSAIC LEVEL 3: EDITORIAL DUO (Articles 4 & 5) */}
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
      {/* MOSAIC LEVEL 4: 3-COLUMN EDITORIAL MOSAIC GRID */}
      {/* ==================================================== */}
      {remainingArticles.length > 0 && (
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between border-b border-lines pb-4">
            <h3 className="font-serif text-2xl md:text-3xl text-charcoal font-semibold">
              {dict?.mosaic?.recentTitle || (lang === 'es' ? 'Más Publicaciones Recientes' : 'Máis Publicacións Recentes')}
            </h3>
            <Link
              href={`/${lang}/articulos`}
              className="text-xs font-bold uppercase tracking-[0.2em] text-gold hover:text-charcoal transition-colors flex items-center gap-1"
            >
              <span>{dict?.mosaic?.viewAll || (lang === 'es' ? 'Ver todo el archivo' : 'Ver todo o arquivo')}</span>
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
      <RevealOnScroll delayMs={100} className="flex justify-center pt-6">
        <Link
          href={`/${lang}/articulos`}
          className="btn-outline text-xs tracking-[0.2em]"
        >
          {dict?.mosaic?.exploreAll || (lang === 'es' ? 'Explorar el Archivo Completo' : 'Explorar o Arquivo Completo')}
          <span aria-hidden="true">→</span>
        </Link>
      </RevealOnScroll>
    </section>
  );
}
