import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import {
  getDashboardPublications,
  computeGuestPublicationQuota,
  PUBLICATION_STATUSES,
  canAccessWriterDesk,
  isGuestRole,
  canPublishDirectly,
} from '@/lib/db';
import FormattedDate from '@/components/ui/FormattedDate';
import DeleteArticleButton from '@/components/escritorio/DeleteArticleButton';
import PinArticleButton from '@/components/escritorio/PinArticleButton';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ ver?: string; filtro?: string }>;
}

export default async function EscritorioPage({ params: routeParams, searchParams }: PageProps) {
  const [params, routeParamsResolved, { user, profile, role }] = await Promise.all([
    searchParams,
    routeParams,
    getAuthenticatedUser(),
  ]);
  const lang = resolveLocale(routeParamsResolved?.lang);
  const dict = await getDictionary(lang);
  const verTodo = params.ver === 'todo';
  const filtro = params.filtro || 'todos';

  if (!user) {
    redirect(`/${lang}/login`);
  }

  const userRole = profile?.role || role;
  if (!canAccessWriterDesk(userRole)) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  const isGuest = isGuestRole(userRole);
  const canReview = canPublishDirectly(userRole);
  const forApproval = filtro === 'para_aprobar' && canReview;

  const allPublications = await getDashboardPublications({
    authorId: user.id,
    forApproval,
  });

  // Client-side filter
  let filteredPublications = allPublications;
  if (filtro === 'borradores') {
    filteredPublications = allPublications.filter((p) => p.status === PUBLICATION_STATUSES.DRAFT);
  } else if (filtro === 'publicados') {
    filteredPublications = allPublications.filter((p) => p.status === PUBLICATION_STATUSES.PUBLISHED);
  } else if (filtro === 'pendientes') {
    filteredPublications = allPublications.filter((p) => p.status === PUBLICATION_STATUSES.IN_REVIEW);
  }

  const displayedPublications = verTodo ? filteredPublications : filteredPublications.slice(0, 3);

  const guestQuota = computeGuestPublicationQuota(allPublications);
  const canCreate = !isGuest || guestQuota.canCreate;

  const authorDisplayName = profile?.full_name || dict.escritorioPage.defaultAuthorName;

  return (
    <main className="px-5 md:px-16 pb-24 flex flex-col flex-1">
      <div className="flex-1">
        <section className="mt-16 mb-16">
          <div className="max-w-280 mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="font-serif text-4xl mb-4">{dict.escritorioPage.welcome}{authorDisplayName}</h2>
                {isGuest && (
                  <div className="flex flex-col text-sm font-sans text-charcoal/80 bg-gold/10 p-4 border border-gold/20 rounded-sm mb-4 md:mb-0">
                    <p className="mb-1"><strong className="text-gold">{dict.escritorioPage.guest}</strong></p>
                    <p>{dict.escritorioPage.yearlyLimit}: {guestQuota.yearlyCount} / {guestQuota.yearlyLimit}</p>
                    <p>{dict.escritorioPage.totalLimit}: {guestQuota.totalCount} / {guestQuota.totalLimit}</p>
                  </div>
                )}
              </div>
              {canCreate ? (
                <Link
                  href={`/${lang}/escritorio/nuevo`}
                  className="flex items-center gap-3 bg-charcoal text-parchment px-8 py-5 font-sans text-sm uppercase tracking-widest hover:bg-gold transition-all duration-300 hover:shadow-lg hover:-translate-y-1 shrink-0 group"
                >
                  <span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-90" data-icon="add">add</span>
                  {dict.escritorioPage.createPost}
                </Link>
              ) : (
                <div className="flex items-center gap-3 bg-lines text-charcoal/40 px-8 py-5 font-sans text-sm uppercase tracking-widest cursor-not-allowed shrink-0">
                  <span className="material-symbols-outlined" data-icon="lock">lock</span>
                  {dict.escritorioPage.limitReached}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-lines shrink-0 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <h3 className="font-serif text-2xl">{dict.escritorioPage.articles}</h3>
              <div className="flex flex-wrap items-center gap-2 font-sans text-xs uppercase tracking-widest">
                <Link className={`px-4 py-2 border border-lines rounded-full transition-colors ${filtro === 'todos' ? 'bg-charcoal text-parchment border-charcoal' : 'bg-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/50'}`} href="?filtro=todos">{dict.escritorioPage.all}</Link>
                <Link className={`px-4 py-2 border border-lines rounded-full transition-colors ${filtro === 'publicados' ? 'bg-charcoal text-parchment border-charcoal' : 'bg-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/50'}`} href="?filtro=publicados">{dict.escritorioPage.published}</Link>
                <Link className={`px-4 py-2 border border-lines rounded-full transition-colors ${filtro === 'borradores' ? 'bg-charcoal text-parchment border-charcoal' : 'bg-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/50'}`} href="?filtro=borradores">{dict.escritorioPage.drafts}</Link>
                {!canReview ? (
                  <Link className={`px-4 py-2 border border-lines rounded-full transition-colors ${filtro === 'pendientes' ? 'bg-charcoal text-parchment border-charcoal' : 'bg-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/50'}`} href="?filtro=pendientes">{dict.escritorioPage.pending}</Link>
                ) : (
                  <Link className={`px-4 py-2 border border-gold/50 rounded-full transition-colors ${filtro === 'para_aprobar' ? 'bg-gold text-parchment border-gold' : 'bg-transparent text-gold hover:bg-gold/10 hover:border-gold'}`} href="?filtro=para_aprobar">{dict.escritorioPage.toApprove}</Link>
                )}
              </div>
            </div>
            {!verTodo && filteredPublications.length > 3 ? (
              <Link className="font-sans text-xs text-charcoal/60 hover:text-gold uppercase tracking-widest underline decoration-1" href={`?filtro=${filtro}&ver=todo`}>{dict.escritorioPage.viewAll}</Link>
            ) : verTodo ? (
              <Link className="font-sans text-xs text-charcoal/60 hover:text-gold uppercase tracking-widest underline decoration-1" href={`?filtro=${filtro}`}>{dict.escritorioPage.viewRecent}</Link>
            ) : null}
          </div>
          <div className="overflow-y-auto scrollbar-none pb-16" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <div className="space-y-12">
                {displayedPublications.length > 0 ? displayedPublications.map((pub) => {
                  const title = resolveLocalizedText(pub.title, lang);
                  const subtitle = pub.subtitle ? resolveLocalizedText(pub.subtitle, lang) : null;
                  const typeLabel = (dict.documentTypes as Record<string, string>)?.[pub.type] || pub.type;

                  return (
                    <article className={`group ${pub.status === PUBLICATION_STATUSES.DRAFT ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`} key={pub.id}>
                      <div className="flex gap-8">
                        <div className="hidden sm:block w-32 h-32 shrink-0 border border-lines overflow-hidden relative">
                          {pub.cover_image_url ? (
                            <Image className="object-cover transition-all duration-700" src={pub.cover_image_url} alt={title || dict.escritorioPage.defaultCoverAlt} fill sizes="128px" />
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
                            <FormattedDate
                              date={pub.published_at || pub.created_at}
                              lang={lang}
                              format="short"
                              className="font-sans text-xs text-charcoal/60"
                            />
                            {pub.status === PUBLICATION_STATUSES.DRAFT && (
                              <>
                                <span className="w-1 h-1 bg-charcoal/20 rounded-full"></span>
                                <span className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded-sm border border-gold/20">{dict.escritorioPage.draft}</span>
                              </>
                            )}
                            {pub.status === PUBLICATION_STATUSES.IN_REVIEW && (
                              <>
                                <span className="w-1 h-1 bg-charcoal/20 rounded-full"></span>
                                <span className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded-sm border border-gold/20">{dict.escritorioPage.pending}</span>
                              </>
                            )}
                            {forApproval && pub.author?.full_name && (
                              <>
                                <span className="w-1 h-1 bg-charcoal/20 rounded-full"></span>
                                <span className="font-sans text-xs text-charcoal/60 font-semibold">{dict.escritorio.author} {pub.author.full_name}</span>
                              </>
                            )}
                          </div>
                          <Link href={`/${lang}/articulo/${pub.slug || pub.id}`}>
                            <h4 className="font-serif text-2xl mb-3 group-hover:text-gold transition-colors cursor-pointer">{title}</h4>
                          </Link>
                          {subtitle && (
                            <p className="font-sans text-base text-charcoal/60 line-clamp-2">
                              {subtitle}
                            </p>
                          )}
                          <div className="mt-4 flex items-center gap-6">
                            <Link href={forApproval ? `/${lang}/articulo/${pub.slug || pub.id}` : `/${lang}/escritorio/editar/${pub.slug || pub.id}`} className={`flex items-center gap-1 transition-colors cursor-pointer ${forApproval ? 'text-gold hover:text-charcoal' : 'text-charcoal/60 hover:text-gold'}`}>
                              <span className="material-symbols-outlined text-sm" data-icon={forApproval ? 'visibility' : 'edit'}>{forApproval ? 'visibility' : 'edit'}</span>
                              <span className={`font-sans text-xs ${forApproval ? 'font-bold uppercase tracking-widest' : ''}`}>{forApproval ? dict.escritorio.review : dict.escritorioPage.edit}</span>
                            </Link>
                            {pub.status === PUBLICATION_STATUSES.PUBLISHED && (
                              <PinArticleButton id={pub.id} isPinned={pub.is_pinned || false} />
                            )}
                            {!forApproval && (
                              canReview || pub.status !== PUBLICATION_STATUSES.PUBLISHED
                            ) && (
                              <DeleteArticleButton id={pub.id} titulo={title} />
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }) : (
                  <p className="font-sans text-charcoal/60">
                    {(forApproval || filtro === 'pendientes')
                      ? dict.escritorioPage.noPendingArticles
                      : dict.escritorioPage.noArticles}
                  </p>
                )}
              </div>
            </div>
        </section>
      </div>
    </main>
  );
}
