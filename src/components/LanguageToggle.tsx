'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setLocale } from '@/app/actions/locale';

export default function LanguageToggle() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState<string | null>(null);

  useEffect(() => {
    // Read the locale from document.cookie on the client side
    const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
    setCurrentLocale(match ? match[1] : 'gl');
  }, []);

  const switchLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    setCurrentLocale(newLocale);
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  };

  if (!currentLocale) return <div className="w-16 h-6" />; // Skeleton

  return (
    <div 
      className="flex items-center border border-lines rounded-full overflow-hidden text-[10px] font-sans font-bold uppercase tracking-widest h-6"
      role="group"
      aria-label="Selector de idioma"
    >
      <button
        onClick={() => switchLocale('gl')}
        disabled={isPending}
        aria-pressed={currentLocale === 'gl'}
        aria-label="Cambiar a Galego"
        className={`px-2 h-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
          currentLocale === 'gl' ? 'bg-charcoal text-parchment' : 'text-charcoal/60 hover:bg-charcoal/5'
        }`}
      >
        GL
      </button>
      <div className="w-[1px] h-full bg-lines" aria-hidden="true" />
      <button
        onClick={() => switchLocale('es')}
        disabled={isPending}
        aria-pressed={currentLocale === 'es'}
        aria-label="Cambiar a Castellano"
        className={`px-2 h-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
          currentLocale === 'es' ? 'bg-charcoal text-parchment' : 'text-charcoal/60 hover:bg-charcoal/5'
        }`}
      >
        ES
      </button>
    </div>
  );
}
