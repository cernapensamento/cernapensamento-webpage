'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';

export default function NoticiasSideFilter({ 
  availableTags, 
  dict 
}: { 
  availableTags: {slug: string, name: string}[], 
  dict: { searchPlaceholder?: string; searchTitle: string; tagsTitle: string; addTagPlaceholder: string; removeTagTooltip: string; clearFilters: string; } 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentQuery = searchParams.get('q') || '';
  const currentTags = searchParams.getAll('tema');

  const [query, setQuery] = useState(currentQuery);
  const [tagSearch, setTagSearch] = useState('');
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);

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
    }, 500);
    return () => clearTimeout(handler);
  }, [query, currentQuery, pathname, router]);

  const toggleTag = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tema');
    
    if (tag !== '') {
      const newTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
      newTags.forEach(t => params.append('tema', t));
    }
    
    setTagSearch('');
    router.push(pathname + '?' + params.toString(), { scroll: false });
  };

  const clearFilters = () => {
    setQuery('');
    setTagSearch('');
    router.push(pathname, { scroll: false });
  };

  const filteredTags = availableTags.filter(t => 
      !currentTags.includes(t.slug) && 
      t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const hasActiveFilters = currentQuery !== '' || currentTags.length > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Search Input */}
      <div>
        <h3 className="text-xs font-semibold text-gold uppercase tracking-[0.2em] mb-4">
          {dict.searchTitle}
        </h3>
        <div className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.searchPlaceholder} 
            className="w-full bg-transparent border border-lines py-3 px-4 text-sm font-sans text-charcoal focus:outline-none focus:border-gold transition-colors placeholder:text-charcoal/40"
          />
          <span className="material-symbols-outlined absolute right-3 top-3.5 text-charcoal/50 text-[20px]">search</span>
        </div>
      </div>

      {/* Tag Selector */}
      <div>
        <h3 className="text-xs font-semibold text-gold uppercase tracking-[0.2em] mb-4">
          {dict.tagsTitle}
        </h3>

        {/* Selected Tags Pills */}
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {currentTags.map(slug => {
                const tagObj = availableTags.find(t => t.slug === slug);
                const name = tagObj ? tagObj.name : slug;
                return (
                    <button type="button" key={slug} className="flex items-center gap-1 px-3 py-1.5 bg-lines/30 text-charcoal text-[10px] uppercase tracking-[0.15em] rounded-sm group cursor-pointer hover:bg-charcoal hover:text-parchment transition-colors" onClick={() => toggleTag(slug)} title={dict.removeTagTooltip}>
                        {name}
                        <span className="material-symbols-outlined text-[12px] opacity-70 group-hover:opacity-100" style={{ fontFamily: 'Material Symbols Outlined' }}>close</span>
                    </button>
                );
            })}
          </div>
        )}

        {/* Combobox */}
        <div className="relative">
            <input 
              className="w-full border border-lines bg-transparent font-sans text-xs text-charcoal tracking-widest uppercase focus:outline-none focus:border-gold p-3" 
              placeholder={dict.addTagPlaceholder} 
              type="text" 
              value={tagSearch} 
              onChange={(e) => setTagSearch(e.target.value)} 
              onFocus={() => setIsTagInputFocused(true)} 
              onBlur={() => setTimeout(() => setIsTagInputFocused(false), 200)}
            />
            
            {isTagInputFocused && filteredTags.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-lines shadow-lg z-50 max-h-48 overflow-y-auto">
                    {filteredTags.map(t => (
                        <button type="button" key={t.slug} className="w-full text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-gold/10 hover:text-gold transition-colors" onMouseDown={() => toggleTag(t.slug)}>
                            {t.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div>
          <button 
            type="button" 
            onClick={clearFilters}
            className="w-full px-6 py-3 border border-charcoal text-[10px] font-sans uppercase tracking-[0.2em] text-charcoal hover:bg-charcoal hover:text-parchment transition-colors text-center"
          >
            {dict.clearFilters}
          </button>
        </div>
      )}
    </div>
  );
}
