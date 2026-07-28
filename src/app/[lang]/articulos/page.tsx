import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import ArticleCard from '@/components/features/ArticleCard';
import ArticlesFilterBar from '@/components/features/ArticlesFilterBar';
import PublicNavBar from '@/components/layout/PublicNavBar';
import SiteFooter from '@/components/layout/SiteFooter';
import Link from 'next/link';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';

export const revalidate = 0;

export default async function ArticulosPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const temaRaw = resolvedParams.tema;
  const temasArray = Array.isArray(temaRaw) ? temaRaw : (typeof temaRaw === 'string' && temaRaw ? [temaRaw] : []);

  // 1. Obtener todas las etiquetas únicas directamente de los artículos publicados
  const { data: allArticles } = await supabase
    .from('articulos')
    .select('tematicas')
    .eq('estado', 'publicado');

  const extractedTags = new Set<string>();
  if (allArticles) {
    allArticles.forEach(a => {
      if (a.tematicas) a.tematicas.forEach((t: string) => extractedTags.add(t));
    });
  }
  const dynamicTags = Array.from(extractedTags).sort();

  // 2. Obtener los artículos aplicando los filtros
  let query = supabase
    .from('articulos')
    .select(`*, perfiles ( nombre )`)
    .eq('estado', 'publicado')
    .order('creado_en', { ascending: false });

  if (q) {
    query = query.or(`titulo_gl.ilike.%${q}%,titulo_es.ilike.%${q}%,contenido_gl.ilike.%${q}%,contenido_es.ilike.%${q}%`);
  }
  if (temasArray.length > 0) {
    query = query.contains('tematicas', temasArray);
  }

  const { data: articulos, error } = await query;

  return (
    <>
      <PublicNavBar />
      <main className="min-h-screen bg-parchment pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-4">{dict.articles.tag}</span>
            <h1 className="font-serif text-5xl md:text-7xl text-charcoal">{dict.articles.title}</h1>
          </div>

          <Suspense fallback={<div className="h-32 flex items-center justify-center"><div className="animate-pulse w-full max-w-2xl h-12 bg-lines/50 rounded"></div></div>}>
            <ArticlesFilterBar availableTags={dynamicTags} dict={dict.articles} />
          </Suspense>

          {error && (
            <div className="text-center py-20 text-charcoal/50">
              <p>{dict.articles.errorLoading} {error.message}</p>
            </div>
          )}

          {!error && articulos && articulos.length === 0 && (
            <div className="text-center py-32 border-t border-lines">
              <p className="font-serif text-2xl text-charcoal/50 mb-6">{dict.articles.noResults}</p>
              <Link href={`/${lang}/articulos`} className="px-6 py-3 border border-charcoal text-xs font-sans uppercase tracking-[0.2em] text-charcoal hover:bg-charcoal hover:text-parchment transition-colors">{dict.articles.clearFilters}</Link>
            </div>
          )}

          {!error && articulos && articulos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 border-t border-lines pt-16">
              {articulos.map((articulo) => (
                <ArticleCard key={articulo.id} articulo={articulo} lang={lang} dict={dict} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter variant="full" />
    </>
  );
}
