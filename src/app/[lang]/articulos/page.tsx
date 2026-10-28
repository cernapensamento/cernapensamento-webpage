import { Suspense } from 'react';
import ArticlesArchiveList from '@/components/features/ArticlesArchiveList';
import ArticlesFilterBar from '@/components/features/ArticlesFilterBar';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';
import { getAllTagsWithTranslations, getPublicationCards, type PublicationType } from '@/lib/db';

export const revalidate = 60;

function normalizePublicationType(raw: string | string[] | undefined): PublicationType | undefined {
  if (!raw || Array.isArray(raw)) return undefined;
  const val = raw.toLowerCase().trim();
  if (val === 'artigo' || val === 'articulo' || val === 'article') return 'article' as PublicationType;
  if (val === 'ensaio' || val === 'ensayo' || val === 'essay') return 'essay' as PublicationType;
  if (val === 'poesia' || val === 'poesía' || val === 'poetry') return 'poetry' as PublicationType;
  if (val === 'columna' || val === 'narrativa' || val === 'column') return 'column' as PublicationType;
  if (val === 'entrevista' || val === 'interview') return 'interview' as PublicationType;
  if (val === 'reportaxe' || val === 'reportaje' || val === 'reportage') return 'reportage' as PublicationType;
  return val as PublicationType;
}

export default async function ArticulosPage({
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
  const tipoRaw = resolvedParams.tipo || resolvedParams.type;
  const currentType = normalizePublicationType(tipoRaw);

  // 1. Get all available tags with localized names
  const availableTags = await getAllTagsWithTranslations({ lang });

  // 2. Fetch the 10 most recent articles plus teaser preview articles (limit: 14)
  const publications = await getPublicationCards({
    type: currentType,
    tagSlugs: temasArray.length > 0 ? temasArray : undefined,
    searchQuery: q,
    limit: 14,
    lang,
  });

  const listKey = `${currentType || 'all'}-${temasArray.join(',')}-${q}`;

  return (
    <>
      <main className="flex-grow min-h-screen bg-parchment pt-8 sm:pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-4">{dict.articles.tag}</span>
            <h1 className="font-serif text-5xl md:text-7xl text-charcoal">{dict.articles.title}</h1>
          </div>

          <Suspense fallback={<div className="h-32 flex items-center justify-center"><div className="animate-pulse w-full max-w-2xl h-12 bg-lines/50 rounded"></div></div>}>
            <ArticlesFilterBar availableTags={availableTags} dict={dict.articles} documentTypes={dict.documentTypes} />
          </Suspense>

          <ArticlesArchiveList
            key={listKey}
            initialArticles={publications}
            lang={lang}
            dict={dict}
            filterOptions={{
              type: currentType,
              tagSlugs: temasArray.length > 0 ? temasArray : undefined,
              searchQuery: q,
            }}
          />
        </div>
      </main>
    </>
  );
}

