import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import StatCard from '@/components/escritorio/StatCard';
import DraftItem from '@/components/escritorio/DraftItem';
import QuoteBox from '@/components/escritorio/QuoteBox';
import SiteFooter from '@/components/SiteFooter';
export default async function EscritorioDelEscritorElDialecto() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  // Redirigir a los lectores (rol 'usuario') a la pantalla de configuración de perfil
  if (profile?.rol === 'usuario') {
    redirect('/escritorio/perfil');
  }

  const { data: articulos } = await supabase
    .from('articulos')
    .select('*')
    .eq('autor_id', user.id)
    .order('creado_en', { ascending: false });

  const publicados = articulos?.filter(a => a.estado === 'publicado' || !a.estado) || [];
  const borradores = articulos?.filter(a => a.estado === 'borrador') || [];

  return (
    <main className="px-5 md:px-16 pb-24">
      {/*  Page Header Section  */}
      <section className="mt-16 mb-16">
<div className="max-w-[1120px] mx-auto">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
<div>
<h2 className="font-serif text-4xl mb-4">Bienvenido, {profile?.nombre || 'Editor'}.</h2>
<p className="font-sans text-lg text-charcoal/60 max-w-2xl">
                            Sus últimas reflexiones sobre la ética del capital han generado una conversación significativa. Aquí tiene el estado actual de su obra.
                        </p>
</div>
<button className="flex items-center gap-3 bg-charcoal text-parchment px-8 py-5 font-sans text-sm uppercase tracking-widest hover:bg-gold transition-all duration-300 hover:shadow-lg hover:-translate-y-1 shrink-0 group">
<span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-90" data-icon="add">add</span>
                        Crear nueva publicación
                    </button>
</div>
</div>
</section>
{/*  Stats Overview Grid  */}
<section className="mb-16">
<div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
{/*  Stat Card 1  */}
<StatCard label="Artículos Publicados" value={articulos?.length?.toString() || "0"} barWidth="66%" barColor="gold" />
{/*  Stat Card 2  */}
<StatCard label="Tiempo de Lectura Promedio" value="-" barWidth="0%" barColor="charcoal" isUpcoming />
{/*  Stat Card 3  */}
<StatCard label="Suscripciones Recientes" value="-" barWidth="0%" barColor="gold" isUpcoming />
</div>
</section>
{/*  Article Lists Section (Bento Inspired)  */}
<section className="max-w-[1120px] mx-auto">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
{/*  Recent Publications Column  */}
<div className="lg:col-span-7">
<div className="flex items-center justify-between mb-8 pb-4 border-b border-lines">
<h3 className="font-serif text-2xl">Publicaciones Recientes</h3>
<Link className="font-sans text-xs text-charcoal/60 hover:text-gold uppercase tracking-widest underline decoration-1" href="#">Ver todo</Link>
</div>
<div className="space-y-12">
{publicados.length > 0 ? publicados.map(articulo => (
<article className="group" key={articulo.id}>
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
</div>
<Link href={`/articulo/${articulo.slug || articulo.id}`}>
<h4 className="font-serif text-2xl mb-3 group-hover:text-gold transition-colors cursor-pointer">{articulo.titulo}</h4>
</Link>
<p className="font-sans text-base text-charcoal/60 line-clamp-2">{articulo.contenido.replace(/<[^>]*>?/gm, '').substring(0, 150)}...</p>
<div className="mt-4 flex items-center gap-6">
<Link href={`/escritorio/editar/${articulo.slug || articulo.id}`} className="flex items-center gap-1 text-charcoal/60 hover:text-gold transition-colors cursor-pointer">
<span className="material-symbols-outlined text-sm" data-icon="edit">edit</span>
<span className="font-sans text-xs">Editar</span>
</Link>
</div>
</div>
</div>
</article>
)) : (
<p className="font-sans text-charcoal/60">No tienes publicaciones todavía.</p>
)}
</div>
</div>
{/*  Drafts and Activity Column  */}
<div className="lg:col-span-5 flex flex-col gap-8">
{/*  Drafts List  */}
<div className="border border-lines p-8 bg-surface">
<h3 className="font-sans text-sm uppercase tracking-[0.2em] text-charcoal/60 mb-8 border-b border-lines pb-4">Borradores en curso</h3>
<div className="space-y-6">
  {borradores.length > 0 ? borradores.map(borrador => (
      <div key={borrador.id} className="group border-b border-lines/50 pb-4 last:border-0 last:pb-0">
          <Link href={`/escritorio/editar/${borrador.slug || borrador.id}`} className="block group-hover:text-gold transition-colors">
              <h4 className="font-serif text-lg mb-1">{borrador.titulo}</h4>
              <span className="font-sans text-[10px] uppercase tracking-widest text-charcoal/40 group-hover:text-charcoal/60 transition-colors">
                  Actualizado {new Date(borrador.actualizado_en || borrador.creado_en).toLocaleDateString()}
              </span>
          </Link>
      </div>
  )) : (
      <p className="font-sans text-sm text-charcoal/60">No hay borradores.</p>
  )}
</div>
<button className="mt-10 w-full border border-charcoal py-3 font-sans text-sm uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all">
                            Ver todos los borradores
                        </button>
</div>
{/*  Atmospheric Quote Box  */}
<QuoteBox quote="La escritura es la pintura de la voz." author="Voltaire" />
</div>
</div>
</section>
{/*  Footer Shell  */}
<SiteFooter variant="minimal" />
      </main>
  );
}
