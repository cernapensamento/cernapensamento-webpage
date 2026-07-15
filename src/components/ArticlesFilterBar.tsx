'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

export default function ArticlesFilterBar({ availableTags }: { availableTags: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentQuery = searchParams.get('q') || '';
  const currentTag = searchParams.get('tema') || '';

  const [query, setQuery] = useState(currentQuery);

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
    const handler = setTimeout(() => {
      if (query !== currentQuery) {
        router.push(pathname + '?' + createQueryString('q', query), { scroll: false });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [query, currentQuery, pathname, router, createQueryString]);

  const toggleTag = (tag: string) => {
    const newTag = currentTag === tag ? '' : tag;
    router.push(pathname + '?' + createQueryString('tema', newTag), { scroll: false });
  };

  return (
    <div className="w-full mb-16">
      <div className="max-w-3xl mx-auto mb-10 relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título o contenido..." 
          className="w-full bg-transparent border-b border-charcoal/30 py-4 px-4 text-xl font-sans text-charcoal focus:outline-none focus:border-gold transition-colors placeholder:text-charcoal/40"
        />
        <span className="material-symbols-outlined absolute right-2 top-4 text-charcoal/50 text-2xl">search</span>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => toggleTag('')}
          className={`px-5 py-2 border font-sans text-xs uppercase tracking-[0.15em] transition-all duration-300 ${!currentTag ? 'bg-charcoal text-parchment border-charcoal' : 'border-lines text-charcoal/70 hover:border-charcoal hover:text-charcoal'}`}
        >
          Todos
        </button>
        {availableTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-5 py-2 border font-sans text-xs uppercase tracking-[0.15em] transition-all duration-300 ${currentTag === tag ? 'bg-charcoal text-parchment border-charcoal' : 'border-lines text-charcoal/70 hover:border-charcoal hover:text-charcoal'}`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
