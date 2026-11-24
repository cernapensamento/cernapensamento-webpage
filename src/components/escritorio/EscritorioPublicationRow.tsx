import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { i18n, type Locale } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import { getAvailablePublicationLocales } from '@/lib/i18n/publicationLanguage';
import { PUBLICATION_STATUSES, type PublicationDashboardItem } from '@/lib/db';
import type { Dictionary } from '@/dictionaries/client';
import FormattedDate from '@/components/ui/FormattedDate';
import DeleteArticleButton from '@/components/escritorio/DeleteArticleButton';
import PinArticleButton from '@/components/escritorio/PinArticleButton';

interface EscritorioPublicationRowProps {
  pub: PublicationDashboardItem;
  lang: Locale;
  dict: Dictionary;
  forApproval: boolean;
  canReview: boolean;
}

function resolveDashboardLanguageBadge(
  pub: PublicationDashboardItem,
  dict: Dictionary
): string {
  const availableLocales = getAvailablePublicationLocales({
    title: pub.title,
    original_language: pub.original_language,
  });

  if (availableLocales.length >= i18n.locales.length) {
    return dict.escritorioPage.languageBadge.bilingual;
  }

  const effectiveLocale =
    availableLocales[0] ??
    (pub.original_language === 'es' ? 'es' : 'gl');

  return effectiveLocale === 'es'
    ? dict.escritorioPage.languageBadge.es
    : dict.escritorioPage.languageBadge.gl;
}

export default function EscritorioPublicationRow({
  pub,
  lang,
  dict,
  forApproval,
  canReview,
}: EscritorioPublicationRowProps) {
  const fallbackLang = pub.original_language || i18n.defaultLocale;
  const resolvedTitle = resolveLocalizedText(pub.title, lang, fallbackLang);
  const title = resolvedTitle || dict.escritorioPage.untitledDraft;
  const subtitle = pub.subtitle
    ? resolveLocalizedText(pub.subtitle, lang, fallbackLang)
    : null;
  const languageBadge = resolveDashboardLanguageBadge(pub, dict);
  const typeLabel =
    (dict.documentTypes as Record<string, string>)?.[pub.type] || pub.type;
  const slugOrId = pub.slug || pub.id;
  const readerHref = `/${lang}/articulo/${slugOrId}`;
  const editHref = `/${lang}/escritorio/editar/${slugOrId}`;
  const isPublished = pub.status === PUBLICATION_STATUSES.PUBLISHED;
  const titleHref = forApproval || isPublished ? readerHref : editHref;
  const actionHref = forApproval ? readerHref : editHref;

  return (
    <article
      className={`group ${pub.status === PUBLICATION_STATUSES.DRAFT ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`}
    >
      <div className="flex gap-8">
        <div className="hidden sm:block w-32 h-32 shrink-0 border border-lines overflow-hidden relative">
          {pub.cover_image_url ? (
            <Image
              className="object-cover transition-all duration-700"
              src={pub.cover_image_url}
              alt={resolvedTitle || dict.escritorioPage.defaultCoverAlt}
              fill
              sizes="128px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-lines text-charcoal/20">
              <span className="font-serif text-3xl">§</span>
            </div>
          )}
        </div>
        <div className="grow">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-sans text-xs text-gold uppercase tracking-widest">
              {typeLabel}
            </span>
            <span className="w-1 h-1 bg-charcoal/20 rounded-full" />
            <span className="px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal/75 bg-surface border border-lines rounded-sm">
              {languageBadge}
            </span>
            <span className="w-1 h-1 bg-charcoal/20 rounded-full" />
            <FormattedDate
              date={pub.published_at || pub.created_at}
              lang={lang}
              format="short"
              className="font-sans text-xs text-charcoal/60"
            />
            {pub.status === PUBLICATION_STATUSES.DRAFT && (
              <>
                <span className="w-1 h-1 bg-charcoal/20 rounded-full" />
                <span className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded-sm border border-gold/20">
                  {dict.escritorioPage.draft}
                </span>
              </>
            )}
            {pub.status === PUBLICATION_STATUSES.IN_REVIEW && (
              <>
                <span className="w-1 h-1 bg-charcoal/20 rounded-full" />
                <span className="px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded-sm border border-gold/20">
                  {dict.escritorioPage.pending}
                </span>
              </>
            )}
            {forApproval && pub.author?.full_name && (
              <>
                <span className="w-1 h-1 bg-charcoal/20 rounded-full" />
                <span className="font-sans text-xs text-charcoal/60 font-semibold">
                  {dict.escritorio.author} {pub.author.full_name}
                </span>
              </>
            )}
          </div>
          <Link href={titleHref}>
            <h4 className="font-serif text-2xl mb-3 group-hover:text-gold transition-colors cursor-pointer">
              {title}
            </h4>
          </Link>
          {subtitle && (
            <p className="font-sans text-base text-charcoal/60 line-clamp-2">
              {subtitle}
            </p>
          )}
          <div className="mt-4 flex items-center gap-6">
            <Link
              href={actionHref}
              className={`flex items-center gap-1 transition-colors cursor-pointer ${forApproval ? 'text-gold hover:text-charcoal' : 'text-charcoal/60 hover:text-gold'}`}
            >
              <span
                className="material-symbols-outlined text-sm"
                data-icon={forApproval ? 'visibility' : 'edit'}
              >
                {forApproval ? 'visibility' : 'edit'}
              </span>
              <span
                className={`font-sans text-xs ${forApproval ? 'font-bold uppercase tracking-widest' : ''}`}
              >
                {forApproval ? dict.escritorio.review : dict.escritorioPage.edit}
              </span>
            </Link>
            {isPublished && (
              <PinArticleButton id={pub.id} isPinned={pub.is_pinned || false} />
            )}
            {!forApproval && (canReview || !isPublished) && (
              <DeleteArticleButton id={pub.id} titulo={title} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
