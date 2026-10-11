import { Suspense } from 'react';
import ArticleCard from '@/components/features/ArticleCard';
import ArticlesFilterBar from '@/components/features/ArticlesFilterBar';
import Link from 'next/link';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';
import { getAllTagsWithTranslations, getPublicationCards, PUBLICATION_TYPES } from '@/lib/db';

export const revalidate = 60;

export default async function NoticiasPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const resolvedParams = await searchParams;

  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const temaRaw = resolvedParams.tema;
  const temasArray = Array.isArray(temaRaw) ? temaRaw : (typeof temaRaw === 'string' && temaRaw ? [temaRaw] : []);

  // 1. Get all available tags with localized names
  const availableTags = await getAllTagsWithTranslations({ lang });

  // 2. Fetch news publications using typed DAL
  const publications = await getPublicationCards({
    type: PUBLICATION_TYPES.NEWS,
    tagSlugs: temasArray.length > 0 ? temasArray : undefined,
    searchQuery: q,
    limit: 60,
    lang,
  });

  const pageTitle = (dict.nav as Record<string, string>)?.noticias || (lang === 'es' ? 'Noticias' : 'Novas');

  return (
    <>
      <main className="flex-grow min-h-screen bg-parchment pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-4">
              Cerna Pensamento
            </span>
            <h1 className="font-serif text-5xl md:text-7xl text-charcoal">
              {pageTitle}
            </h1>
          </div>

          <Suspense fallback={<div className="h-32 flex items-center justify-center"><div className="animate-pulse w-full max-w-2xl h-12 bg-lines/50 rounded"></div></div>}>
            <ArticlesFilterBar availableTags={availableTags} dict={dict.articles} />
          </Suspense>

          {publications.length === 0 ? (
            <div className="text-center py-32 border-t border-lines">
              <p className="font-serif text-2xl text-charcoal/50 mb-6">{dict.articles.noResults}</p>
              <Link href={`/${lang}/noticias`} className="px-6 py-3 border border-charcoal text-xs font-sans uppercase tracking-[0.2em] text-charcoal hover:bg-charcoal hover:text-parchment transition-colors">{dict.articles.clearFilters}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 border-t border-lines pt-16">
              {publications.map((publication) => (
                <ArticleCard key={publication.id} articulo={publication} lang={lang} dict={dict} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

