'use client';

import { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';

export default function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const currentLocale = useLocale();

  const switchLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    // Set cookie for middleware
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    
    // Replace URL
    if (!pathname) return;
    
    // Create new pathname by replacing the current locale
    const segments = pathname.split('/');
    segments[1] = newLocale; // Assumes /[lang]/...
    const newPathname = segments.join('/');

    startTransition(() => {
      router.push(newPathname);
    });
  };

  if (!currentLocale) return <div className="w-10 h-10 border border-lines bg-parchment" />; // Skeleton

  const nextLocale = currentLocale === 'gl' ? 'es' : 'gl';

  return (
    <button 
      type="button"
      onClick={() => switchLocale(nextLocale)}
      disabled={isPending}
      className="border border-lines bg-parchment text-charcoal hover:bg-lines transition-colors duration-300 flex items-center justify-center w-10 h-10 shadow-lg text-xs font-serif font-bold tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      aria-label={`Cambiar a ${nextLocale === 'gl' ? 'Galego' : 'Castellano'}`}
      title={`Cambiar a ${nextLocale === 'gl' ? 'Galego' : 'Castellano'}`}
    >
      {currentLocale.toUpperCase()}
    </button>
  );
}
