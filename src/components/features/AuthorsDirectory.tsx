'use client';

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import FormattedDate from '@/components/ui/FormattedDate';
import type { PublicationType, UserRole } from '@/lib/db/types';
import { USER_ROLES } from '@/lib/db/schema';

export interface AuthorDirectoryItem {
  id: string;
  full_name: string;
  slug: string | null;
  avatar_url: string | null;
  bio: string;
  role: UserRole;
  published_count: number;
  latest_publication_at: string | null;
  latest_publication_title: string | null;
  latest_publication_slug: string | null;
  publication_types: PublicationType[];
}

interface AuthorsPageDict {
  eyebrow: string;
  home: string;
  breadcrumbs: string;
  portraitOf: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  allTypes: string;
  typeFilterLabel: string;
  sortLabel: string;
  sortRecent: string;
  sortName: string;
  sortWorks: string;
  authorCountSingular: string;
  authorCountPlural: string;
  publicationCountSingular: string;
  publicationCountPlural: string;
  publicationSingular: string;
  publicationPlural: string;
  showing: string;
  latestWork: string;
  viewProfile: string;
  noResults: string;
  clearFilters: string;
  resultsLabel: string;
  collaborateEyebrow: string;
  collaborateTitle: string;
  collaborateDescription: string;
  collaborateCta: string;
  roles: {
    founder: string;
    editorialBoard: string;
    contributor: string;
  };
}

interface AuthorsDirectoryProps {
  authors: AuthorDirectoryItem[];
  lang: string;
  dict: AuthorsPageDict;
  documentTypes: Record<string, string>;
}

type SortOption = 'recent' | 'works' | 'name';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function AnimatedNumber({ value }: { value: number }) {
  // Render the real figure on the server (and without JS); animate once hydrated.
  const [display, setDisplay] = useState(value);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reduceMotion || value === 0) return;

    let frame = 0;
    const start = performance.now();
    const duration = 850;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}</>;
}

function AuthorCard({
  author,
  lang,
  dict,
  documentTypes,
}: {
  author: AuthorDirectoryItem;
  index: number;
  lang: string;
  dict: AuthorsPageDict;
  documentTypes: Record<string, string>;
}) {
  const [imageError, setImageError] = useState(false);
  const authorHref = `/${lang}/autor/${author.slug || author.id}`;
  const typeLabels = author.publication_types.map(
    (type) => documentTypes[type] || type
  );
  const visibleTypes = typeLabels.slice(0, 3);
  const extraTypes = typeLabels.length - visibleTypes.length;
  const roleLabel =
    author.role === USER_ROLES.FOUNDER
      ? dict.roles.founder
      : author.role === USER_ROLES.ADMIN
        ? dict.roles.editorialBoard
        : dict.roles.contributor;
  const showsImage = Boolean(author.avatar_url) && !imageError;

  return (
    <Link
      href={authorHref}
      className="group relative flex w-full h-full flex-col justify-between border border-lines bg-surface p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
      />

      <div>
        {/* Top Header: Avatar & Identification */}
        <div className="flex items-start gap-4 mb-5">
          {showsImage ? (
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border border-gold/40 shrink-0 bg-parchment group-hover:border-gold transition-colors">
              <Image
                src={author.avatar_url as string}
                alt={`${dict.portraitOf} ${author.full_name}`}
                fill
                sizes="80px"
                className="object-cover object-top grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border border-gold/40 shrink-0 bg-parchment flex items-center justify-center font-serif text-xl sm:text-2xl font-bold text-gold group-hover:border-gold group-hover:scale-105 transition-all shadow-inner">
              <span>{getInitials(author.full_name)}</span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-gold truncate">
                {roleLabel}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/50 shrink-0">
                {author.published_count}{' '}
                {author.published_count === 1
                  ? dict.publicationSingular
                  : dict.publicationPlural}
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-charcoal group-hover:text-gold transition-colors mt-1.5 leading-snug truncate">
              {author.full_name}
            </h3>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {visibleTypes.map((label) => (
                <span
                  key={label}
                  className="font-sans text-[9px] uppercase tracking-[0.14em] text-charcoal/65 bg-parchment border border-lines px-2 py-0.5"
                >
                  {label}
                </span>
              ))}
              {extraTypes > 0 && (
                <span className="font-sans text-[9px] uppercase tracking-[0.14em] text-charcoal/40">
                  +{extraTypes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Golden Hairline Divider */}
        <span
          aria-hidden="true"
          className="block h-[1.5px] w-8 bg-gold/70 transition-all duration-500 group-hover:w-16 mb-4"
        />

        {/* Bio Excerpt */}
        <p className="font-sans text-xs sm:text-sm text-charcoal/70 line-clamp-3 leading-relaxed mb-6">
          {author.bio || '—'}
        </p>
      </div>

      {/* Footer: Latest Work Leaf & Action */}
      <div className="pt-4 border-t border-lines/60 flex flex-col gap-3">
        <div className="min-w-0">
          <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
            {dict.latestWork}
          </span>
          <span className="mt-0.5 block truncate font-serif text-xs sm:text-sm font-semibold text-charcoal/85">
            {author.latest_publication_title || '—'}
          </span>
          <FormattedDate
            date={author.latest_publication_at}
            lang={lang}
            format="short"
            className="mt-0.5 block font-sans text-[10px] text-charcoal/50"
          />
        </div>

        <div className="pt-2 flex items-center justify-between font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal group-hover:text-gold transition-colors">
          <span>{dict.viewProfile}</span>
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1"
          >
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function AuthorsDirectory({
  authors,
  lang,
  dict,
  documentTypes,
}: AuthorsDirectoryProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const sortedAuthors = useMemo(() => {
    return [...authors].sort((a, b) => {
      if (sortBy === 'name') {
        return a.full_name.localeCompare(b.full_name, lang === 'gl' ? 'gl' : 'es');
      }

      if (sortBy === 'works') {
        if (b.published_count !== a.published_count) {
          return b.published_count - a.published_count;
        }
        return a.full_name.localeCompare(b.full_name, lang === 'gl' ? 'gl' : 'es');
      }

      const aDate = a.latest_publication_at
        ? new Date(a.latest_publication_at).getTime()
        : 0;
      const bDate = b.latest_publication_at
        ? new Date(b.latest_publication_at).getTime()
        : 0;

      if (bDate !== aDate) return bDate - aDate;
      return a.full_name.localeCompare(b.full_name, lang === 'gl' ? 'gl' : 'es');
    });
  }, [authors, sortBy, lang]);

  const totalPublications = useMemo(
    () => authors.reduce((total, author) => total + author.published_count, 0),
    [authors]
  );

  const authorCountLabel =
    authors.length === 1 ? dict.authorCountSingular : dict.authorCountPlural;
  const publicationCountLabel =
    totalPublications === 1
      ? dict.publicationCountSingular
      : dict.publicationCountPlural;

  return (
    <>
      <section className="relative overflow-hidden border-b border-lines bg-parchment">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-10 select-none font-serif text-[240px] leading-none text-charcoal/[0.035] dark:text-parchment/[0.035] md:text-[320px]"
        >
          &sect;
        </span>

        <div className="relative mx-auto w-full max-w-[1120px] px-5 pb-12 pt-8 sm:pt-10 md:pb-16 md:pt-12">
          <nav
            aria-label={dict.breadcrumbs}
            className="flex items-center gap-2 font-sans text-xs text-charcoal/50"
          >
            <Link
              href={`/${lang}`}
              className="transition-colors hover:text-gold"
            >
              {dict.home}
            </Link>
            <span className="text-[10px] text-charcoal/30">/</span>
            <span className="text-charcoal/50">{dict.resultsLabel}</span>
          </nav>

          <div className="mt-10 grid grid-cols-1 items-end gap-10 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div
                className="mb-4 flex animate-appear-instant items-center gap-3"
                style={{ animationDelay: '40ms' }}
              >
                <span className="h-[2px] w-8 bg-gold" aria-hidden="true" />
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.3em] text-gold">
                  {dict.eyebrow}
                </span>
              </div>

              <h1
                className="max-w-3xl animate-appear-instant font-serif text-5xl leading-[0.95] text-charcoal sm:text-6xl md:text-7xl"
                style={{ animationDelay: '100ms' }}
              >
                {dict.title}
              </h1>

              <p
                className="mt-6 max-w-2xl animate-appear-instant font-sans text-base leading-relaxed text-charcoal/70 md:text-lg"
                style={{ animationDelay: '180ms' }}
              >
                {dict.description}
              </p>
            </div>

            <div
              className="animate-appear-instant xl:col-span-4 xl:border-l xl:border-lines xl:pl-8"
              style={{ animationDelay: '260ms' }}
            >
              <div className="grid grid-cols-2 gap-6 border-t border-lines pt-6 xl:border-t-0 xl:pt-0">
                <div>
                  <span className="block font-serif text-4xl text-charcoal tabular-nums md:text-5xl">
                    <span className="sr-only">{authors.length}</span>
                    <span aria-hidden="true">
                      <AnimatedNumber value={authors.length} />
                    </span>
                  </span>
                  <span className="mt-2 block font-sans text-[10px] uppercase tracking-[0.2em] text-charcoal/45">
                    {authorCountLabel}
                  </span>
                </div>

                <div className="border-l border-lines pl-6">
                  <span className="block font-serif text-4xl text-charcoal tabular-nums md:text-5xl">
                    <span className="sr-only">{totalPublications}</span>
                    <span aria-hidden="true">
                      <AnimatedNumber value={totalPublications} />
                    </span>
                  </span>
                  <span className="mt-2 block font-sans text-[10px] uppercase tracking-[0.2em] text-charcoal/45">
                    {publicationCountLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="authors-directory-heading"
        className="bg-parchment"
      >
        <div className="mx-auto w-full max-w-[1120px] px-5 py-10 md:px-16 md:py-14">
          <h2 id="authors-directory-heading" className="sr-only">
            {dict.resultsLabel}
          </h2>

          {/* Sorting controls */}
          <div className="flex items-center justify-end mb-8">
            <div className="relative w-full sm:w-auto">
              <label htmlFor="author-sort" className="sr-only">
                {dict.sortLabel}
              </label>
              <select
                id="author-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className="w-full appearance-none border border-lines bg-surface py-2.5 pl-4 pr-10 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal/75 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold sm:w-auto sm:min-w-[170px]"
              >
                <option value="recent">{dict.sortRecent}</option>
                <option value="works">{dict.sortWorks}</option>
                <option value="name">{dict.sortName}</option>
              </select>
              <span
                aria-hidden="true"
                className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-charcoal/40"
              >
                expand_more
              </span>
            </div>
          </div>

          <div>
            {sortedAuthors.length > 0 ? (
              <div
                key={sortBy}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              >
                {sortedAuthors.map((author, index) => (
                  <RevealOnScroll
                    key={author.id}
                    delayMs={(index % 3) * 80}
                    className="h-full"
                  >
                    <AuthorCard
                      author={author}
                      index={index}
                      lang={lang}
                      dict={dict}
                      documentTypes={documentTypes}
                    />
                  </RevealOnScroll>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-lines bg-surface/40 px-6 py-20 text-center">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-4xl text-gold/60"
                >
                  person_search
                </span>
                <p className="mt-4 font-serif text-2xl text-charcoal">
                  {dict.noResults}
                </p>
              </div>
            )}
          </div>

          <div className="mt-16 border-t border-lines pt-12 text-center">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
              {dict.collaborateEyebrow}
            </p>

            <h2 className="mt-4 font-serif text-3xl text-charcoal md:text-4xl">
              {dict.collaborateTitle}
            </h2>

            <p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-charcoal/70">
              {dict.collaborateDescription}
            </p>

            <Link
              href={`/${lang}/contacto`}
              className="group mt-8 inline-flex items-center gap-3 border border-charcoal bg-charcoal px-7 py-3.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-parchment transition-all duration-300 hover:border-gold hover:bg-gold hover:text-[#1a1a1a]"
            >
              {dict.collaborateCta}
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1"
              >
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
