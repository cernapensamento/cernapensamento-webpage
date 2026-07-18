import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavBar from '@/components/PublicNavBar';
import SiteFooter from '@/components/SiteFooter';
import FeaturedArticleHero from '@/components/FeaturedArticleHero';
import PinnedArticlesPanel from '@/components/PinnedArticlesPanel';
import ArticleCard from '@/components/ArticleCard';
import ColumnistsSection from '@/components/ColumnistsSection';
import AboutUsSection from '@/components/AboutUsSection';
import ThemesSection from '@/components/ThemesSection';
import ContactSection from '@/components/ContactSection';


export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Obtener artículos con el nombre del autor
  const { data: articulos, error } = await supabase
    .from('articulos')
    .select('id, titulo_gl, titulo_es, subtitulo_gl, subtitulo_es, slug, imagen_url, contenido_gl, contenido_es, estado, creado_en, fijado, tipo, perfiles(nombre)')
    .eq('estado', 'publicado')
    .order('creado_en', { ascending: false });

  const allArticles = articulos || [];
  const pinnedArticles = allArticles.filter(a => a.fijado).slice(0, 8);
  const regularArticles = allArticles.filter(a => !a.fijado);

  const featuredArticle = regularArticles.length > 0 ? regularArticles[0] : null;
  const otherArticles = regularArticles.length > 1 ? regularArticles.slice(1, 7) : [];

  return (
    <>
      <PublicNavBar />

      <main className="flex-grow w-full max-w-[1120px] mx-auto px-5 md:px-16 pt-12 pb-[120px] flex flex-col gap-[120px]">
        
        {featuredArticle && (
          <FeaturedArticleHero articulo={featuredArticle} />
        )}

        <section className="border-t border-lines pt-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
            
            {otherArticles && otherArticles.length > 0 ? otherArticles.map((articulo) => (
              <ArticleCard key={articulo.id} articulo={articulo} />
            )) : (
              <p className="font-sans text-charcoal/60">Non hai artigos adicionais publicados.</p>
            )}
          </div>
        </section>

        <PinnedArticlesPanel articulos={pinnedArticles} />
      </main>
      
      <AboutUsSection />
      <ThemesSection />
      <ColumnistsSection />
      <ContactSection />

      <SiteFooter variant="full" />


    </>
  );
}
