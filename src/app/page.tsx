import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavBar from '@/components/PublicNavBar';
import SiteFooter from '@/components/SiteFooter';
import FeaturedArticleHero from '@/components/FeaturedArticleHero';
import ArticleCard from '@/components/ArticleCard';
import ColumnistsSection from '@/components/ColumnistsSection';
import AboutUsSection from '@/components/AboutUsSection';
import ThemesSection from '@/components/ThemesSection';
export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from('perfiles')
      .select('rol, nombre')
      .eq('id', user.id)
      .single();
    userProfile = profile;
  }

  // Obtener artículos con el nombre del autor
  const { data: articulos, error } = await supabase
    .from('articulos')
    .select('*, perfiles(nombre)')
    .eq('estado', 'publicado')
    .order('creado_en', { ascending: false });

  const featuredArticle = articulos && articulos.length > 0 ? articulos[0] : null;
  const otherArticles = articulos && articulos.length > 1 ? articulos.slice(1, 7) : [];

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
              <p className="font-sans text-charcoal/60">No hay artículos adicionales publicados.</p>
            )}
          </div>
        </section>
      </main>
      
      <AboutUsSection />
      <ThemesSection />
      <ColumnistsSection />

      <SiteFooter variant="full" />


    </>
  );
}
