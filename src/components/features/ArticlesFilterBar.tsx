'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';
import { PUBLICATION_TYPES, type PublicationTypeValue } from '@/lib/db/schema';

const PUBLICATION_TYPE_OPTIONS: PublicationTypeValue[] = [
  PUBLICATION_TYPES.ESSAY,
  PUBLICATION_TYPES.ARTICLE,
  PUBLICATION_TYPES.POETRY,
  PUBLICATION_TYPES.COLUMN,
  PUBLICATION_TYPES.INTERVIEW,
  PUBLICATION_TYPES.REPORTAGE,
];

function normalizePublicationType(raw: string | null | undefined): string {
  if (!raw) return '';
  const val = raw.toLowerCase().trim();
  if (val === 'artigo' || val === 'articulo' || val === PUBLICATION_TYPES.ARTICLE) return PUBLICATION_TYPES.ARTICLE;
  if (val === 'ensaio' || val === 'ensayo' || val === PUBLICATION_TYPES.ESSAY) return PUBLICATION_TYPES.ESSAY;
  if (val === 'poesia' || val === 'poesía' || val === PUBLICATION_TYPES.POETRY) return PUBLICATION_TYPES.POETRY;
  if (val === 'columna' || val === 'narrativa' || val === PUBLICATION_TYPES.COLUMN) return PUBLICATION_TYPES.COLUMN;
  if (val === 'entrevista' || val === PUBLICATION_TYPES.INTERVIEW) return PUBLICATION_TYPES.INTERVIEW;
  if (val === 'reportaxe' || val === 'reportaje' || val === PUBLICATION_TYPES.REPORTAGE) return PUBLICATION_TYPES.REPORTAGE;
  return val;
}

interface ArticlesFilterBarProps {
  availableTags: { slug: string; name: string }[];
  dict: {
    searchPlaceholder?: string;
    all?: string;
    filterByType?: string;
    filterByTopic?: string;
    [key: string]: unknown;
  };
  documentTypes?: Record<string, string>;
}

export default function ArticlesFilterBar({
  availableTags,
  dict,
  documentTypes = {},
}: ArticlesFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQuery = searchParams.get('q') || '';
  const currentTags = searchParams.getAll('tema');
  const currentTagsSet = new Set(currentTags);
  const currentType = normalizePublicationType(searchParams.get('tipo') || searchParams.get('type'));

  const [query, setQuery] = useState(currentQuery);
  const createQueryStringRef = useRef<((name: string, value: string) => string) | null>(null);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    createQueryStringRef.current = createQueryString;
  }, [createQueryString]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query !== currentQuery && createQueryStringRef.current) {
        router.push(pathname + '?' + createQueryStringRef.current('q', query), { scroll: false });
      }
    }, 450);
    return () => clearTimeout(handler);
  }, [query, currentQuery, pathname, router]);

  const toggleTag = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tema');

    if (tag !== '') {
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      newTags.forEach((t) => params.append('tema', t));
    }

    router.push(pathname + '?' + params.toString(), { scroll: false });
  };

  const setTypeFilter = (typeKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // Normalize to 'tipo'
    params.delete('type');

    if (!typeKey || currentType === typeKey) {
      params.delete('tipo');
    } else {
      params.set('tipo', typeKey);
    }

    router.push(pathname + '?' + params.toString(), { scroll: false });
  };

  return (
    <div className="w-full mb-16 flex flex-col gap-8">
      {/* Search Input Bar */}
      <div className="max-w-3xl mx-auto w-full relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full bg-transparent border-b border-charcoal/30 py-4 px-4 pr-12 text-lg sm:text-xl font-sans text-charcoal focus:outline-none focus:border-gold transition-colors placeholder:text-charcoal/40"
        />
        <span
          className="material-symbols-outlined absolute right-2 top-4 text-charcoal/50 text-2xl pointer-events-none"
          aria-hidden="true"
        >
          search
        </span>
      </div>

      {/* 1. Publication Type Filter Row */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-charcoal/50 font-semibold select-none">
          {dict.filterByType || 'Tipo de publicación'}
        </span>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setTypeFilter('')}
            className={`px-4 sm:px-5 py-1.5 border font-sans text-xs uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer ${
              !currentType
                ? 'bg-gold text-parchment border-gold shadow-sm font-semibold'
                : 'border-lines text-charcoal/70 bg-surface/50 hover:border-gold/60 hover:text-charcoal'
            }`}
          >
            {dict.all || 'Todos'}
          </button>
          {PUBLICATION_TYPE_OPTIONS.map((tKey) => {
            const label = documentTypes[tKey] || tKey;
            const isSelected = currentType.toLowerCase() === tKey.toLowerCase();
            return (
              <button
                type="button"
                key={tKey}
                onClick={() => setTypeFilter(tKey)}
                className={`px-4 sm:px-5 py-1.5 border font-sans text-xs uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-gold text-parchment border-gold shadow-sm font-semibold'
                    : 'border-lines text-charcoal/70 bg-surface/50 hover:border-gold/60 hover:text-charcoal'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Topic Taxonomy Filter Row */}
      <div className="flex flex-col items-center gap-3 pt-2 border-t border-lines/50">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-charcoal/50 font-semibold select-none">
          {dict.filterByTopic || 'Temática'}
        </span>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => toggleTag('')}
            className={`px-4 sm:px-5 py-1.5 border font-sans text-xs uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer ${
              currentTags.length === 0
                ? 'bg-charcoal text-parchment border-charcoal shadow-sm font-semibold'
                : 'border-lines text-charcoal/70 bg-surface/50 hover:border-charcoal hover:text-charcoal'
            }`}
          >
            {dict.all || 'Todas'}
          </button>
          {availableTags.map((tag) => {
            const isSelected = currentTagsSet.has(tag.slug);
            return (
              <button
                type="button"
                key={tag.slug}
                onClick={() => toggleTag(tag.slug)}
                className={`px-4 sm:px-5 py-1.5 border font-sans text-xs uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-charcoal text-parchment border-charcoal shadow-sm font-semibold'
                    : 'border-lines text-charcoal/70 bg-surface/50 hover:border-charcoal hover:text-charcoal'
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
