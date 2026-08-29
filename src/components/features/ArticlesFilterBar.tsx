'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';

export default function ArticlesFilterBar({ availableTags, dict }: { availableTags: {slug: string, name: string}[], dict: { searchPlaceholder?: string; all?: string; [key: string]: unknown } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentQuery = searchParams.get('q') || '';
  const currentTags = searchParams.getAll('tema');
  const currentTagsSet = new Set(currentTags);

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
    
    router.push(pathname + '?' + params.toString(), { scroll: false });
  };

  return (
    <div className="w-full mb-16">
      <div className="max-w-3xl mx-auto mb-10 relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder} 
          className="w-full bg-transparent border-b border-charcoal/30 py-4 px-4 text-xl font-sans text-charcoal focus:outline-none focus:border-gold transition-colors placeholder:text-charcoal/40"
        />
        <span className="material-symbols-outlined absolute right-2 top-4 text-charcoal/50 text-2xl">search</span>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => toggleTag('')}
          className={`px-5 py-2 border font-sans text-xs uppercase tracking-[0.15em] transition-all duration-300 ${currentTags.length === 0 ? 'bg-charcoal text-parchment border-charcoal' : 'border-lines text-charcoal/70 hover:border-charcoal hover:text-charcoal'}`}
        >
          {dict.all}
        </button>
        {availableTags.map((tag) => (
          <button type="button" key={tag.slug}
            onClick={() => toggleTag(tag.slug)}
            className={`px-5 py-2 border font-sans text-xs uppercase tracking-[0.15em] transition-all duration-300 ${currentTagsSet.has(tag.slug) ? 'bg-charcoal text-parchment border-charcoal' : 'border-lines text-charcoal/70 hover:border-charcoal hover:text-charcoal'}`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
