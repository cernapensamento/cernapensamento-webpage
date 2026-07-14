import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';

import SiteFooter from '@/components/SiteFooter';
import DeleteArticleButton from '@/components/escritorio/DeleteArticleButton';

interface PageProps {
  searchParams: Promise<{ ver?: string; filtro?: string }>;
}

export default async function EscritorioDelEscritorElDialecto({ searchParams }: PageProps) {
  const params = await searchParams;
  const verTodo = params.ver === 'todo';
  const filtro = params.filtro || 'todos';

  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  if (profile?.rol === 'usuario') {
    redirect('/escritorio/perfil');
  }

  const { data: articulos } = await supabase
    .from('articulos')
    .select('*')
    .eq('autor_id', user.id)
    .order('creado_en', { ascending: false });

  const todosLosArticulos = articulos || [];
  const articulosFiltrados = filtro === 'borradores'
    ? todosLosArticulos.filter(a => a.estado === 'borrador')
    : filtro === 'publicados'
    ? todosLosArticulos.filter(a => a.estado === 'publicado' || !a.estado)
    : todosLosArticulos;
  const displayedArticles = verTodo ? articulosFiltrados : articulosFiltrados.slice(0, 3);

  return (
    <main className="px-5 md:px-16 pb-24 flex flex-col flex-1">
      <div className="flex-1">
        <section className="mt-16 mb-16">
          <div className="max-w-[1120px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="font-serif text-4xl mb-4">Bienvenido, {profile?.nombre || 'Editor'}.</h2>
              </div>
              <Link
                href="/escritorio/nuevo"
                className="flex items-center gap-3 bg-charcoal text-parchment px-8 py-5 font-sans text-sm uppercase tracking-widest hover:bg-gold transition-all duration-300 hover:shadow-lg hover:-translate-y-1 shrink-0 group"
              >
                <span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-90" data-icon="add">add</span>
                Crear nueva publicación
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-lines shrink-0">
            <div className="flex items-center gap-6">
              <h3 className="font-serif text-2xl">Artículos</h3>
              <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest">
                <Link className={`px-3 py-1.5 transition-colors ${filtro === 'todos' ? 'bg-charcoal text-parchment' : 'text-charcoal/60 hover:text-charcoal'}`} href="?filtro=todos">Todos</Link>
                <Link className={`px-3 py-1.5 transition-colors ${filtro === 'publicados' ? 'bg-charcoal text-parchment' : 'text-charcoal/60 hover:text-charcoal'}`} href="?filtro=publicados">Publicados</Link>
                <Link className={`px-3 py-1.5 transition-colors ${filtro === 'borradores' ? 'bg-charcoal text-parchment' : 'text-charcoal/60 hover:text-charcoal'}`} href="?filtro=borradores">Borradores</Link>
              </div>
            </div>
            {!verTodo && articulosFiltrados.length > 3 ? (
              <Link className="font-sans text-xs text-charcoal/60 hover:text-gold uppercase tracking-widest underline decoration-1" href={`?filtro=${filtro}&ver=todo`}>Ver todo</Link>
            ) : verTodo ? (
              <Link className="font-sans text-xs text-charcoal/60 hover:text-gold uppercase tracking-widest underline decoration-1" href={`?filtro=${filtro}`}>Ver recientes</Link>
            ) : null}
          </div>
          <div className="overflow-y-auto scrollbar-none pb-16" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <div className="space-y-12">
                {displayedArticles.length > 0 ? displayedArticles.map(articulo => (
                  <article className={`group ${articulo.estado === 'borrador' ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`} key={articulo.id}>
                    <div className="flex gap-8">
                      <div className="hidden sm:block w-32 h-32 shrink-0 border border-lines overflow-hidden relative">
                        {articulo.imagen_url ? (
                          <Image className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src={articulo.imagen_url} alt={articulo.titulo} fill sizes="128px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-lines text-charcoal/20">
                            <span className="font-serif text-3xl">§</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="font-sans text-xs text-gold uppercase tracking-widest">Artículo</span>
                          <span className="w-1 h-1 bg-charcoal/20 rounded-full"></span>
                          <span className="font-sans text-xs text-charcoal/60">{new Date(articulo.creado_en).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          {articulo.estado === 'borrador' && (
                            <>
                              <span className="w-1 h-1 bg-charcoal/20 rounded-full"></span>
                              <span className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded-sm border border-gold/20">Borrador</span>
                            </>
                          )}
                        </div>
                        <Link href={`/articulo/${articulo.slug || articulo.id}`}>
                          <h4 className="font-serif text-2xl mb-3 group-hover:text-gold transition-colors cursor-pointer">{articulo.titulo}</h4>
                        </Link>
                        <p className="font-sans text-base text-charcoal/60 line-clamp-2">
                          {articulo.subtitulo || articulo.contenido.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'}
                        </p>
                        <div className="mt-4 flex items-center gap-6">
                          <Link href={`/escritorio/editar/${articulo.slug || articulo.id}`} className="flex items-center gap-1 text-charcoal/60 hover:text-gold transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-sm" data-icon="edit">edit</span>
                            <span className="font-sans text-xs">Editar</span>
                          </Link>
                          <DeleteArticleButton id={articulo.id} titulo={articulo.titulo} />
                        </div>
                      </div>
                    </div>
                  </article>
                )) : (
                  <p className="font-sans text-charcoal/60">No tienes artículos todavía. Crea tu primera publicación.</p>
                )}
              </div>
            </div>
        </section>
      </div>

      <SiteFooter variant="minimal" />
    </main>
  );
}
