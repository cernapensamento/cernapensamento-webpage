'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';
import {
  PUBLICATION_TYPES,
  parsePublicationType,
  type PublicationTypeValue,
} from '@/lib/db/schema';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

const PUBLICATION_TYPE_OPTIONS: PublicationTypeValue[] = [
  PUBLICATION_TYPES.ESSAY,
  PUBLICATION_TYPES.ARTICLE,
  PUBLICATION_TYPES.POETRY,
  PUBLICATION_TYPES.COLUMN,
  PUBLICATION_TYPES.INTERVIEW,
  PUBLICATION_TYPES.REPORTAGE,
];

interface FilterOption {
  key: string;
  label: string;
  isSelected: boolean;
}

const FILTER_BUTTON_BASE =
  'px-4 sm:px-5 py-1.5 border font-sans text-xs uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer';

const FILTER_TONE_CLASSES: Record<'gold' | 'charcoal', { active: string; inactive: string }> = {
  gold: {
    active: 'bg-gold text-parchment border-gold shadow-sm font-semibold',
    inactive: 'border-lines text-charcoal/70 bg-surface/50 hover:border-gold/60 hover:text-charcoal',
  },
  charcoal: {
    active: 'bg-charcoal text-parchment border-charcoal shadow-sm font-semibold',
    inactive: 'border-lines text-charcoal/70 bg-surface/50 hover:border-charcoal hover:text-charcoal',
  },
};

function FilterButtonGroup({
  label,
  allLabel,
  isAllSelected,
  onSelectAll,
  options,
  onSelectOption,
  tone,
  className = '',
}: {
  label: string;
  allLabel: string;
  isAllSelected: boolean;
  onSelectAll: () => void;
  options: FilterOption[];
  onSelectOption: (key: string) => void;
  tone: 'gold' | 'charcoal';
  className?: string;
}) {
  const toneClasses = FILTER_TONE_CLASSES[tone];

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`.trim()}>
      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-charcoal/50 font-semibold select-none">
        {label}
      </span>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={onSelectAll}
          className={`${FILTER_BUTTON_BASE} ${isAllSelected ? toneClasses.active : toneClasses.inactive}`}
        >
          {allLabel}
        </button>
        {options.map((option) => (
          <button
            type="button"
            key={option.key}
            onClick={() => onSelectOption(option.key)}
            className={`${FILTER_BUTTON_BASE} ${option.isSelected ? toneClasses.active : toneClasses.inactive}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ArticlesFilterBarProps {
  availableTags: { slug: string; name: string }[];
  dict?: {
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
  documentTypes,
}: ArticlesFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = useLocale();
  const fallbackDict = getDictionaryClient(lang);

  const mergedDict = {
    ...fallbackDict.articles,
    ...dict,
  };
  const mergedDocumentTypes: Record<string, string> = {
    ...(fallbackDict.documentTypes as Record<string, string>),
    ...(documentTypes ?? {}),
  };

  const currentQuery = searchParams.get('q') || '';
  const currentTags = searchParams.getAll('tema');
  const currentTagsSet = new Set(currentTags);
  const currentType = parsePublicationType(searchParams.get('tipo') || searchParams.get('type')) || '';

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

  const typeOptions: FilterOption[] = PUBLICATION_TYPE_OPTIONS.map((tKey) => ({
    key: tKey,
    label: mergedDocumentTypes[tKey] || tKey,
    isSelected: currentType.toLowerCase() === tKey.toLowerCase(),
  }));

  const tagOptions: FilterOption[] = availableTags.map((tag) => ({
    key: tag.slug,
    label: tag.name,
    isSelected: currentTagsSet.has(tag.slug),
  }));

  return (
    <div className="w-full mb-16 flex flex-col gap-8">
      {/* Search Input Bar */}
      <div className="max-w-3xl mx-auto w-full relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mergedDict.searchPlaceholder}
          aria-label={mergedDict.searchPlaceholder}
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
      <FilterButtonGroup
        label={mergedDict.filterByType}
        allLabel={mergedDict.all}
        isAllSelected={!currentType}
        onSelectAll={() => setTypeFilter('')}
        options={typeOptions}
        onSelectOption={setTypeFilter}
        tone="gold"
      />

      {/* 2. Topic Taxonomy Filter Row */}
      <FilterButtonGroup
        label={mergedDict.filterByTopic}
        allLabel={mergedDict.all}
        isAllSelected={currentTags.length === 0}
        onSelectAll={() => toggleTag('')}
        options={tagOptions}
        onSelectOption={toggleTag}
        tone="charcoal"
        className="pt-2 border-t border-lines/50"
      />
    </div>
  );
}
