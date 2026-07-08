import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavBar from '@/components/PublicNavBar';
import SiteFooter from '@/components/SiteFooter';
import FeaturedArticleHero from '@/components/FeaturedArticleHero';
import ArticleCard from '@/components/ArticleCard';

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
    .order('creado_en', { ascending: false });

  const featuredArticle = articulos && articulos.length > 0 ? articulos[0] : null;
  const otherArticles = articulos && articulos.length > 1 ? articulos.slice(1) : [];

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

      <SiteFooter variant="full" />

      {/* Floating Action Button for Writers */}
      {(userProfile?.rol === 'escritor' || userProfile?.rol === 'admin') && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href="/escritorio"
            className="flex items-center gap-2 bg-charcoal text-parchment hover:bg-gold hover:text-parchment px-4 py-3 shadow-lg transition-all duration-300 group border border-charcoal/10"
            title="Ir a tu Escritorio"
          >
            <span className="font-serif text-lg leading-none group-hover:scale-110 transition-transform">
              §
            </span>
            <span className="font-sans text-xs font-semibold uppercase tracking-widest hidden md:inline">
              Escritorio
            </span>
          </Link>
        </div>
      )}
    </>
  );
}
