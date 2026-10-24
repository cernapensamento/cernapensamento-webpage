'use client';

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PublicationType, UserRole } from '@/lib/db/types';

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

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const GL_SHORT_MONTHS = [
  'xan.',
  'feb.',
  'mar.',
  'abr.',
  'maio',
  'xuño',
  'xul.',
  'ago.',
  'set.',
  'out.',
  'nov.',
  'dec.',
];

function formatDate(value: string | null, lang: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  if (lang === 'gl') {
    return `${date.getDate()} ${GL_SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }

  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

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
  index,
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
  const visibleTypes = typeLabels.slice(0, 2);
  const extraTypes = typeLabels.length - visibleTypes.length;
  const roleLabel =
    author.role === 'founder'
      ? dict.roles.founder
      : author.role === 'admin'
        ? dict.roles.editorialBoard
        : dict.roles.contributor;
  const latestDate = formatDate(author.latest_publication_at, lang);
  const showsImage = Boolean(author.avatar_url) && !imageError;

  return (
    <Link
      href={authorHref}
      className="group relative flex w-full animate-fade-in flex-col overflow-hidden border border-lines bg-surface transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-[0_24px_60px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
      style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
      />

      <div className="relative aspect-[4/5] overflow-hidden bg-lines/30">
        {showsImage ? (
          <Image
            src={author.avatar_url as string}
            alt={`${dict.portraitOf} ${author.full_name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top grayscale transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0"
            onError={() => setImageError(true)}
            priority={index < 3}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#242424] via-[#1b1b1b] to-[#111111]">
            <span className="font-serif text-7xl text-white/20">
              {getInitials(author.full_name)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="border border-white/20 bg-black/30 px-2.5 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
            {roleLabel}
          </span>
          <span
            className="border border-white/20 bg-black/30 px-2.5 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm"
            aria-label={`${author.published_count} ${
              author.published_count === 1
                ? dict.publicationSingular
                : dict.publicationPlural
            }`}
          >
            {author.published_count}{' '}
            {author.published_count === 1
              ? dict.publicationSingular
              : dict.publicationPlural}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {visibleTypes.map((label) => (
              <span
                key={label}
                className="font-sans text-[9px] uppercase tracking-[0.2em] text-gold"
              >
                {label}
              </span>
            ))}
            {extraTypes > 0 && (
              <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-white/60">
                +{extraTypes}
              </span>
            )}
          </div>

          <h3 className="font-serif text-2xl leading-tight text-white sm:text-[1.7rem]">
            {author.full_name}
          </h3>

          <span
            aria-hidden="true"
            className="mt-3 block h-[2px] w-8 bg-gold transition-all duration-500 group-hover:w-16"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-3 min-h-[4.5rem] font-sans text-sm leading-relaxed text-charcoal/70">
          {author.bio || '—'}
        </p>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-lines pt-4">
          <div className="min-w-0">
            <span className="block font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
              {dict.latestWork}
            </span>
            <span className="mt-1 block truncate font-serif text-sm text-charcoal/80">
              {author.latest_publication_title || '—'}
            </span>
            {latestDate && (
              <span className="mt-0.5 block font-sans text-[10px] text-charcoal/50">
                {latestDate}
              </span>
            )}
          </div>

          <span className="flex shrink-0 items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-charcoal/75 transition-colors group-hover:text-gold">
            {dict.viewProfile}
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1"
            >
              arrow_forward
            </span>
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
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | PublicationType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const availableTypes = useMemo(() => {
    const counts = new Map<PublicationType, number>();

    authors.forEach((author) => {
      author.publication_types.forEach((type) => {
        counts.set(type, (counts.get(type) || 0) + 1);
      });
    });

    return Array.from(counts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
  }, [authors]);

  const filteredAuthors = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    const result = authors.filter((author) => {
      const matchesType =
        typeFilter === 'all' || author.publication_types.includes(typeFilter);

      if (!matchesType) return false;
      if (!normalizedQuery) return true;

      return normalizeText(`${author.full_name} ${author.bio}`).includes(
        normalizedQuery
      );
    });

    return result.sort((a, b) => {
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
  }, [authors, query, typeFilter, sortBy, lang]);

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
  const showingLabel = dict.showing
    .replace('{shown}', String(filteredAuthors.length))
    .replace('{total}', String(authors.length));

  const clearFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setSortBy('recent');
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-lines bg-parchment">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-10 select-none font-serif text-[240px] leading-none text-charcoal/[0.035] dark:text-parchment/[0.035] md:text-[320px]"
        >
          &sect;
        </span>

        <div className="relative mx-auto w-full max-w-[1120px] px-5 pb-12 pt-10 md:px-16 md:pb-16 md:pt-16">
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

          <div className="z-30 -mx-5 border-y border-lines bg-parchment px-5 py-4 md:-mx-16 md:px-16 md:py-5 xl:sticky xl:top-20">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative w-full shrink-0 sm:w-72">
                  <label htmlFor="author-search" className="sr-only">
                    {dict.searchPlaceholder}
                  </label>
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-charcoal/40"
                  >
                    search
                  </span>
                  <input
                    id="author-search"
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={dict.searchPlaceholder}
                    className="w-full border border-lines bg-surface py-3 pl-11 pr-4 font-sans text-sm text-charcoal transition-colors placeholder:text-charcoal/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-charcoal/45">
                    {dict.typeFilterLabel}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTypeFilter('all')}
                      aria-pressed={typeFilter === 'all'}
                      className={`border px-3 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 ${
                        typeFilter === 'all'
                          ? 'border-gold bg-gold text-parchment'
                          : 'border-lines bg-surface text-charcoal/70 hover:border-gold/50 hover:text-charcoal'
                      }`}
                    >
                      {dict.allTypes}
                    </button>

                    {availableTypes.map(([type, count]) => {
                      const isActive = typeFilter === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setTypeFilter(type)}
                          aria-pressed={isActive}
                          aria-label={`${documentTypes[type] || type} (${count} ${
                            count === 1
                              ? dict.authorCountSingular
                              : dict.authorCountPlural
                          })`}
                          className={`border px-3 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 ${
                            isActive
                              ? 'border-gold bg-gold text-parchment'
                              : 'border-lines bg-surface text-charcoal/70 hover:border-gold/50 hover:text-charcoal'
                          }`}
                        >
                          {documentTypes[type] || type}
                          <span
                            className={`ml-1.5 text-[9px] ${
                              isActive ? 'text-parchment/70' : 'text-charcoal/45'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-lines/60 pt-4">
                <p
                  aria-live="polite"
                  className="font-sans text-[10px] uppercase tracking-[0.16em] text-charcoal/55"
                >
                  {showingLabel}
                </p>

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
                    className="w-full appearance-none border border-lines bg-surface py-3 pl-4 pr-10 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal/75 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold sm:w-auto sm:min-w-[170px]"
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
            </div>
          </div>

          <div className="mt-8">
            {filteredAuthors.length > 0 ? (
              <div
                key={`${typeFilter}-${sortBy}`}
                className="flex flex-wrap justify-center gap-6"
              >
                {filteredAuthors.map((author, index) => (
                  <AuthorCard
                    key={author.id}
                    author={author}
                    index={index}
                    lang={lang}
                    dict={dict}
                    documentTypes={documentTypes}
                  />
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
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 border border-charcoal bg-charcoal px-6 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-parchment transition-colors hover:border-gold hover:bg-gold hover:text-[#1a1a1a]"
                >
                  {dict.clearFilters}
                </button>
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
