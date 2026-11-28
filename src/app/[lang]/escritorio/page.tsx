import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';
import {
  getDashboardPublications,
  getGuestPublicationQuota,
  computeGuestPublicationQuota,
  PUBLICATION_STATUSES,
  PERMISSIONS,
  hasPermission,
  isGuestQuotaSubject,
  type PublicationStatusValue,
} from '@/lib/db';
import { DESK_ERRORS, DESK_FILTERS } from '@/lib/db/schema';
import EscritorioPublicationRow from '@/components/escritorio/EscritorioPublicationRow';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ ver?: string; filtro?: string; error?: string }>;
}

const STATUS_BY_FILTER: Partial<Record<string, PublicationStatusValue>> = {
  [DESK_FILTERS.DRAFTS]: PUBLICATION_STATUSES.DRAFT,
  [DESK_FILTERS.PUBLISHED]: PUBLICATION_STATUSES.PUBLISHED,
  [DESK_FILTERS.IN_REVIEW]: PUBLICATION_STATUSES.IN_REVIEW,
};

const VALID_TAB_FILTERS: ReadonlySet<string> = new Set([
  DESK_FILTERS.ALL,
  DESK_FILTERS.PUBLISHED,
  DESK_FILTERS.DRAFTS,
  DESK_FILTERS.IN_REVIEW,
  DESK_FILTERS.FOR_APPROVAL,
]);

export default async function EscritorioPage({ params: routeParams, searchParams }: PageProps) {
  const [params, routeParamsResolved, { user, profile, permissions }] = await Promise.all([
    searchParams,
    routeParams,
    getAuthenticatedUser(),
  ]);
  const lang = resolveLocale(routeParamsResolved?.lang);
  const dict = await getDictionary(lang);
  const verTodo = params.ver === DESK_FILTERS.VIEW_ALL;
  const filtro = params.filtro && VALID_TAB_FILTERS.has(params.filtro)
    ? params.filtro
    : DESK_FILTERS.ALL;
  const isLimitReachedError = params.error === DESK_ERRORS.LIMIT_REACHED;

  if (!user) {
    redirect(`/${lang}/login`);
  }

  if (!hasPermission(permissions, PERMISSIONS.DESK_ACCESS)) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  const isGuest = isGuestQuotaSubject(permissions);
  const canReview = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_REVIEW);
  const canCreatePerm = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_CREATE);
  const forApproval = filtro === DESK_FILTERS.FOR_APPROVAL && canReview;

  const allPublications = await getDashboardPublications({
    authorId: user.id,
    forApproval,
  });

  const filterStatus = STATUS_BY_FILTER[filtro];
  const filteredPublications = filterStatus
    ? allPublications.filter((p) => p.status === filterStatus)
    : allPublications;

  const displayedPublications = verTodo ? filteredPublications : filteredPublications.slice(0, 3);

  const guestQuota = isGuest
    ? forApproval
      ? await getGuestPublicationQuota(user.id)
      : computeGuestPublicationQuota(allPublications)
    : null;
  const canCreate = canCreatePerm && (!guestQuota || guestQuota.canCreate);

  const authorDisplayName = profile?.full_name || dict.escritorioPage.defaultAuthorName;

  const filterTabs = [
    { key: DESK_FILTERS.ALL, label: dict.escritorioPage.all, accent: false },
    { key: DESK_FILTERS.PUBLISHED, label: dict.escritorioPage.published, accent: false },
    { key: DESK_FILTERS.DRAFTS, label: dict.escritorioPage.drafts, accent: false },
    canReview
      ? { key: DESK_FILTERS.FOR_APPROVAL, label: dict.escritorioPage.toApprove, accent: true }
      : { key: DESK_FILTERS.IN_REVIEW, label: dict.escritorioPage.pending, accent: false },
  ];

  return (
    <main className="px-5 md:px-16 pb-24 flex flex-col flex-1">
      <div className="flex-1">
        <section className="mt-16 mb-16">
          <div className="max-w-280 mx-auto">
            {isLimitReachedError && (
              <div
                role="alert"
                className="mb-8 p-4 border border-gold/40 bg-gold/10 text-charcoal flex items-start gap-3 text-sm font-sans rounded-sm"
              >
                <span className="material-symbols-outlined text-gold shrink-0 text-lg" data-icon="warning">warning</span>
                <div>
                  <p className="font-semibold text-gold uppercase tracking-widest text-xs mb-1">
                    {dict.escritorioPage.limitReached}
                  </p>
                  <p className="text-charcoal/80">
                    {dict.escritorioPage.limitReachedNotice}
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="font-serif text-4xl mb-4">{dict.escritorioPage.welcome}{authorDisplayName}</h2>
                {guestQuota && (
                  <div className="flex flex-col text-sm font-sans text-charcoal/80 bg-gold/10 p-4 border border-gold/20 rounded-sm mb-4 md:mb-0">
                    <p className="mb-1"><strong className="text-gold">{dict.escritorioPage.guest}</strong></p>
                    <p>{dict.escritorioPage.yearlyLimit}: {guestQuota.yearlyCount} / {guestQuota.yearlyLimit}</p>
                    <p>{dict.escritorioPage.totalLimit}: {guestQuota.totalCount} / {guestQuota.totalLimit}</p>
                  </div>
                )}
              </div>
              {canCreatePerm && (
                canCreate ? (
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
                )
              )}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-lines shrink-0 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <h3 className="font-serif text-2xl">{dict.escritorioPage.articles}</h3>
              <div className="flex flex-wrap items-center gap-2 font-sans text-xs uppercase tracking-widest">
                {filterTabs.map((tab) => {
                  const isActive = filtro === tab.key;
                  const styleClass = tab.accent
                    ? isActive
                      ? 'border-gold bg-gold text-parchment'
                      : 'border-gold/50 bg-transparent text-gold hover:bg-gold/10 hover:border-gold'
                    : isActive
                      ? 'border-charcoal bg-charcoal text-parchment'
                      : 'border-lines bg-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/50';
                  return (
                    <Link
                      key={tab.key}
                      className={`px-4 py-2 border rounded-full transition-colors ${styleClass}`}
                      href={`/${lang}/escritorio?filtro=${tab.key}`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            {!verTodo && filteredPublications.length > 3 ? (
              <Link className="font-sans text-xs text-charcoal/60 hover:text-gold uppercase tracking-widest underline decoration-1" href={`/${lang}/escritorio?filtro=${filtro}&ver=${DESK_FILTERS.VIEW_ALL}`}>{dict.escritorioPage.viewAll}</Link>
            ) : verTodo ? (
              <Link className="font-sans text-xs text-charcoal/60 hover:text-gold uppercase tracking-widest underline decoration-1" href={`/${lang}/escritorio?filtro=${filtro}`}>{dict.escritorioPage.viewRecent}</Link>
            ) : null}
          </div>
          <div className="overflow-y-auto scrollbar-none pb-16" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <div className="space-y-12">
                {displayedPublications.length > 0 ? displayedPublications.map((pub) => (
                  <EscritorioPublicationRow
                    key={pub.id}
                    pub={pub}
                    lang={lang}
                    dict={dict}
                    forApproval={forApproval}
                    canReview={canReview}
                    permissions={permissions}
                  />
                )) : (
                  <p className="font-sans text-charcoal/60">
                    {(forApproval || filtro === DESK_FILTERS.IN_REVIEW)
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
