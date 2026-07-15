import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import PublicNavBar from '@/components/PublicNavBar';
import SiteFooter from '@/components/SiteFooter';
import ArticleCard from '@/components/ArticleCard';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AutorPage({ params }: PageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch author profile
  const { data: autor, error: perfilError } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', id)
    .single();

  if (perfilError || !autor) {
    notFound();
  }

  // Fetch articles
  const { data: articulos, error: articulosError } = await supabase
    .from('articulos')
    .select('*, perfiles(nombre)')
    .eq('autor_id', id)
    .eq('estado', 'publicado')
    .order('creado_en', { ascending: false });

  return (
    <div className="min-h-screen bg-parchment flex flex-col selection:bg-gold/20 selection:text-charcoal">
      <PublicNavBar showBackLink />
      
      <main className="flex-grow pt-32 pb-24">
        <div className="max-w-[1120px] mx-auto px-5 md:px-16">
          
          {/* Header Author */}
          <header className="mb-20 text-center border-b border-lines pb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-6">
              Artículos de {autor.nombre}
            </h1>
            {autor.bio && (
              <p className="font-sans text-base text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
                {autor.bio}
              </p>
            )}
          </header>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
            {articulos && articulos.length > 0 ? (
              articulos.map((articulo) => (
                <ArticleCard key={articulo.id} articulo={articulo} />
              ))
            ) : (
              <p className="font-sans text-charcoal/60 col-span-full text-center py-10">
                Este autor no tiene artículos publicados todavía.
              </p>
            )}
          </div>
        </div>
      </main>
      
      <SiteFooter variant="full" />
    </div>
  );
}
