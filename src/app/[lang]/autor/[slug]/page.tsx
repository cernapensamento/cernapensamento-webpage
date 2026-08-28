import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import PublicNavBar from '@/components/layout/PublicNavBar';
import ArticleCard from '@/components/features/ArticleCard';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string; lang: string }>;
}

export default async function AutorPage({ params }: PageProps) {
  const supabase = await createClient();
  const { slug, lang } = await params;
  const dict = await getDictionary(lang as Locale);

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

  // Fetch author profile
  let profileQuery = supabase.from('perfiles').select('*');
  
  if (isUUID) {
    profileQuery = profileQuery.eq('id', slug);
  } else {
    profileQuery = profileQuery.eq('slug', slug);
  }

  const { data: autor, error: perfilError } = await profileQuery.single();

  if (perfilError || !autor) {
    notFound();
  }

  // Fetch articles
  const { data: articulos } = await supabase
    .from('articulos')
    .select('*, perfiles(nombre, slug)')
    .eq('autor_id', autor.id)
    .eq('estado', 'publicado')
    .order('creado_en', { ascending: false });

  return (
    <div className="min-h-screen bg-parchment flex flex-col selection:bg-gold/20 selection:text-charcoal">
      <PublicNavBar />
      
      <main className="flex-grow pt-32 pb-24">
        <div className="max-w-[1120px] mx-auto px-5 md:px-16">
          
          {/* Header Author */}
          <header className="mb-20 text-center border-b border-lines pb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-6">
              {dict.authorPage.articlesBy} {autor.nombre}
            </h1>
            {((autor.slug && dict.authors && (dict.authors as Record<string, string>)[autor.slug]) || autor.bio) && (
              <p className="font-sans text-base text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
                {(autor.slug && dict.authors && (dict.authors as Record<string, string>)[autor.slug]) || autor.bio}
              </p>
            )}
          </header>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
            {articulos && articulos.length > 0 ? (
              articulos.map((articulo) => (
                <ArticleCard key={articulo.id} articulo={articulo} lang={lang} dict={dict} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 border-t border-lines">
                <p className="font-serif text-2xl text-charcoal/50">{dict.authorPage.noArticles}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
    </div>
  );
}
