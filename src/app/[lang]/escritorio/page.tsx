import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';
import {
  DB_TABLES,
  PUBLICATION_COLS,
  USER_COLS,
  PUBLICATION_STATUSES,
  USER_ROLES,
} from '@/lib/db/schema';
import type { LocalizedString } from '@/lib/db/types';

import DeleteArticleButton from '@/components/escritorio/DeleteArticleButton';
import PinArticleButton from '@/components/escritorio/PinArticleButton';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ ver?: string; filtro?: string }>;
}

interface PublicationDashboardItem {
  id: string;
  slug: string;
  title: LocalizedString;
  subtitle: LocalizedString | null;
  cover_image_url: string | null;
  type: string;
  status: string;
  is_pinned: boolean | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  author: {
    id: string;
    full_name: string;
  } | null;
}

export default async function EscritorioDelEscritorElDialecto({ params: routeParams, searchParams }: PageProps) {
  const [params, routeParamsResolved, supabase, { user, profile }] = await Promise.all([
    searchParams,
    routeParams,
    createClient(),
    getAuthenticatedUser()
  ]);
  const lang = routeParamsResolved.lang || 'es';
  const dict = await getDictionary(lang as Locale);
  const verTodo = params.ver === 'todo';
  const filtro = params.filtro || 'todos';

  if (!user) {
    redirect(`/${lang}/login`);
  }

  const roleStr = String(profile?.role || profile?.rol || '');
  if (roleStr === USER_ROLES.READER || roleStr === 'usuario') {
    redirect(`/${lang}/escritorio/perfil`);
  }

  const isGuest = roleStr === USER_ROLES.GUEST || roleStr === 'invitado';
  const canReview = roleStr === USER_ROLES.FOUNDER || roleStr === USER_ROLES.ADMIN || roleStr === 'escritor';

  // Default to user's publications, or publications in review for editorial staff
  let query = supabase
    .from(DB_TABLES.PUBLICATIONS)
    .select(`
      ${PUBLICATION_COLS.ID},
      ${PUBLICATION_COLS.SLUG},
      ${PUBLICATION_COLS.TITLE},
      ${PUBLICATION_COLS.SUBTITLE},
      ${PUBLICATION_COLS.COVER_IMAGE_URL},
      ${PUBLICATION_COLS.TYPE},
      ${PUBLICATION_COLS.STATUS},
      ${PUBLICATION_COLS.IS_PINNED},
      ${PUBLICATION_COLS.CREATED_AT},
      ${PUBLICATION_COLS.UPDATED_AT},
      ${PUBLICATION_COLS.AUTHOR_ID},
      author:${DB_TABLES.USERS} (
        ${USER_COLS.ID},
        ${USER_COLS.FULL_NAME}
      )
    `)
    .order(PUBLICATION_COLS.CREATED_AT, { ascending: false });
  
  if (filtro === 'para_aprobar' && canReview) {
    query = query.eq(PUBLICATION_COLS.STATUS, PUBLICATION_STATUSES.IN_REVIEW);
  } else {
    query = query.eq(PUBLICATION_COLS.AUTHOR_ID, user.id);
  }

  const { data: publicationsRaw } = await query;
  const allPublications = (publicationsRaw || []) as unknown as PublicationDashboardItem[];
  
  // Client-side filter
  let filteredPublications = allPublications;
  if (filtro === 'borradores') {
    filteredPublications = allPublications.filter(a => a.status === PUBLICATION_STATUSES.DRAFT);
  } else if (filtro === 'publicados') {
    filteredPublications = allPublications.filter(a => a.status === PUBLICATION_STATUSES.PUBLISHED);
  } else if (filtro === 'pendientes') {
    filteredPublications = allPublications.filter(a => a.status === PUBLICATION_STATUSES.IN_REVIEW);
  }
  
  const displayedArticles = verTodo ? filteredPublications : filteredPublications.slice(0, 3);

  const currentYear = new Date().getFullYear();
  const articulosEsteAno = allPublications.filter(a => new Date(a.created_at).getFullYear() === currentYear).length;
  const totalArticulos = allPublications.length;
  const limiteTotal = 4;
  const limiteAnual = 2;
  const canCreate = !isGuest || (totalArticulos < limiteTotal && articulosEsteAno < limiteAnual);

  const authorDisplayName = profile?.full_name || 'Editor';

  return (
    <main className="px-5 md:px-16 pb-24 flex flex-col flex-1">
      <div className="flex-1">
        <section className="mt-16 mb-16">
          <div className="max-w-280 mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="font-serif text-4xl mb-4">{dict.escritorioPage?.welcome || 'Bienvenido, '}{authorDisplayName}</h2>
                {isGuest && (
                  <div className="flex flex-col text-sm font-sans text-charcoal/80 bg-gold/10 p-4 border border-gold/20 rounded-sm mb-4 md:mb-0">
                    <p className="mb-1"><strong className="text-gold">{dict.escritorioPage?.guest || 'Autor Invitado'}</strong></p>
                    <p>{dict.escritorioPage?.yearlyLimit || 'Límite anual'}: {articulosEsteAno} / {limiteAnual}</p>
                    <p>{dict.escritorioPage?.totalLimit || 'Límite total'}: {totalArticulos} / {limiteTotal}</p>
                  </div>
                )}
              </div>
              {canCreate ? (
                <Link
                  href={`/${lang}/escritorio/nuevo`}
                  className="flex items-center gap-3 bg-charcoal text-parchment px-8 py-5 font-sans text-sm uppercase tracking-widest hover:bg-gold transition-all duration-300 hover:shadow-lg hover:-translate-y-1 shrink-0 group"
                >
                  <span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-90" data-icon="add">add</span>
                  {dict.escritorioPage?.createPost || 'Nuevo Artículo'}
                </Link>
              ) : (
                <div className="flex items-center gap-3 bg-lines text-charcoal/40 px-8 py-5 font-sans text-sm uppercase tracking-widest cursor-not-allowed shrink-0">
                  <span className="material-symbols-outlined" data-icon="lock">lock</span>
                  {dict.escritorioPage?.limitReached || 'Límite alcanzado'}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-lines shrink-0 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <h3 className="font-serif text-2xl">{dict.escritorioPage?.articles || 'Tus Artículos'}</h3>
              <div className="flex flex-wrap items-center gap-2 font-sans text-xs uppercase tracking-widest">
                <Link className={`px-4 py-2 border border-lines rounded-full transition-colors ${filtro === 'todos' ? 'bg-charcoal text-parchment border-charcoal' : 'bg-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/50'}`} href="?filtro=todos">{dict.escritorioPage?.all || 'Todos'}</Link>
                <Link className={`px-4 py-2 border border-lines rounded-full transition-colors ${filtro === 'publicados' ? 'bg-charcoal text-parchment border-charcoal' : 'bg-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/50'}`} href="?filtro=publicados">{dict.escritorioPage?.published || 'Publicados'}</Link>
                <Link className={`px-4 py-2 border border-lines rounded-full transition-colors ${filtro === 'borradores' ? 'bg-charcoal text-parchment border-charcoal' : 'bg-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/50'}`} href="?filtro=borradores">{dict.escritorioPage?.drafts || 'Borradores'}</Link>
                {isGuest ? (
                  <Link className={`px-4 py-2 border border-lines rounded-full transition-colors ${filtro === 'pendientes' ? 'bg-charcoal text-parchment border-charcoal' : 'bg-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/50'}`} href="?filtro=pendientes">{dict.escritorioPage?.pending || 'Pendientes'}</Link>
                ) : (
                  <Link className={`px-4 py-2 border border-gold/50 rounded-full transition-colors ${filtro === 'para_aprobar' ? 'bg-gold text-parchment border-gold' : 'bg-transparent text-gold hover:bg-gold/10 hover:border-gold'}`} href="?filtro=para_aprobar">{dict.escritorioPage?.toApprove || 'Para Aprobar'}</Link>
                )}
              </div>
            </div>
            {!verTodo && filteredPublications.length > 3 ? (
              <Link className="font-sans text-xs text-charcoal/60 hover:text-gold uppercase tracking-widest underline decoration-1" href={`?filtro=${filtro}&ver=todo`}>{dict.escritorioPage?.viewAll || 'Ver Todos'}</Link>
            ) : verTodo ? (
              <Link className="font-sans text-xs text-charcoal/60 hover:text-gold uppercase tracking-widest underline decoration-1" href={`?filtro=${filtro}`}>{dict.escritorioPage?.viewRecent || 'Ver Recientes'}</Link>
            ) : null}
          </div>
          <div className="overflow-y-auto scrollbar-none pb-16" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <div className="space-y-12">
                {displayedArticles.length > 0 ? displayedArticles.map((articulo) => {
                  const titulo = articulo.title
                    ? (articulo.title[lang] || articulo.title.gl || articulo.title.es || '')
                    : '';
                  const subtitulo = articulo.subtitle
                    ? (articulo.subtitle[lang] || articulo.subtitle.gl || articulo.subtitle.es || null)
                    : null;
                  const typeLabel = (dict.documentTypes as Record<string, string>)?.[articulo.type] || articulo.type;

                  return (
                    <article className={`group ${articulo.status === PUBLICATION_STATUSES.DRAFT ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`} key={articulo.id}>
                      <div className="flex gap-8">
                        <div className="hidden sm:block w-32 h-32 shrink-0 border border-lines overflow-hidden relative">
                          {articulo.cover_image_url ? (
                            <Image className="object-cover transition-all duration-700" src={articulo.cover_image_url} alt={titulo || 'Publicación'} fill sizes="128px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-lines text-charcoal/20">
                              <span className="font-serif text-3xl">§</span>
                            </div>
                          )}
                        </div>
                        <div className="grow">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-sans text-xs text-gold uppercase tracking-widest">{typeLabel}</span>
                            <span className="w-1 h-1 bg-charcoal/20 rounded-full"></span>
                            <span className="font-sans text-xs text-charcoal/60">{new Date(articulo.created_at).toLocaleDateString(lang === 'gl' ? 'gl-ES' : 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            {articulo.status === PUBLICATION_STATUSES.DRAFT && (
                              <>
                                <span className="w-1 h-1 bg-charcoal/20 rounded-full"></span>
                                <span className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded-sm border border-gold/20">{dict.escritorioPage?.draft || 'Borrador'}</span>
                              </>
                            )}
                            {articulo.status === PUBLICATION_STATUSES.IN_REVIEW && (
                              <>
                                <span className="w-1 h-1 bg-charcoal/20 rounded-full"></span>
                                <span className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded-sm border border-gold/20">Pendiente</span>
                              </>
                            )}
                            {filtro === 'para_aprobar' && articulo.author?.full_name && (
                              <>
                                <span className="w-1 h-1 bg-charcoal/20 rounded-full"></span>
                                <span className="font-sans text-xs text-charcoal/60 font-semibold">{dict.escritorio?.author || 'Autor:'} {articulo.author.full_name}</span>
                              </>
                            )}
                          </div>
                          <Link href={`/${lang}/articulo/${articulo.slug || articulo.id}`}>
                            <h4 className="font-serif text-2xl mb-3 group-hover:text-gold transition-colors cursor-pointer">{titulo}</h4>
                          </Link>
                          {subtitulo && (
                            <p className="font-sans text-base text-charcoal/60 line-clamp-2">
                              {subtitulo}
                            </p>
                          )}
                          <div className="mt-4 flex items-center gap-6">
                            <Link href={filtro === 'para_aprobar' ? `/${lang}/articulo/${articulo.slug || articulo.id}` : `/${lang}/escritorio/editar/${articulo.slug || articulo.id}`} className={`flex items-center gap-1 transition-colors cursor-pointer ${filtro === 'para_aprobar' ? 'text-gold hover:text-charcoal' : 'text-charcoal/60 hover:text-gold'}`}>
                              <span className="material-symbols-outlined text-sm" data-icon={filtro === 'para_aprobar' ? 'visibility' : 'edit'}>{filtro === 'para_aprobar' ? 'visibility' : 'edit'}</span>
                              <span className={`font-sans text-xs ${filtro === 'para_aprobar' ? 'font-bold uppercase tracking-widest' : ''}`}>{filtro === 'para_aprobar' ? (dict.escritorio?.review || 'Revisar') : (dict.escritorioPage?.edit || 'Editar')}</span>
                            </Link>
                            {articulo.status === PUBLICATION_STATUSES.PUBLISHED && (
                              <PinArticleButton id={articulo.id} isPinned={articulo.is_pinned || false} />
                            )}
                            {filtro !== 'para_aprobar' && (
                              <DeleteArticleButton id={articulo.id} titulo={titulo} />
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }) : (
                  <p className="font-sans text-charcoal/60">
                    {(filtro === 'para_aprobar' || filtro === 'pendientes') 
                      ? (dict.escritorioPage?.noPendingArticles || 'No hay publicaciones pendientes de aprobación.') 
                      : (dict.escritorioPage?.noArticles || 'Aún no has escrito ningún artículo.')}
                  </p>
                )}
              </div>
            </div>
        </section>
      </div>
    </main>
  );
}
