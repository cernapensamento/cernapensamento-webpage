'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Loading() {
  const pathname = usePathname();
  const [lang, setLang] = useState<'es' | 'gl'>('es');

  useEffect(() => {
    if (pathname && pathname.startsWith('/gl')) {
      setLang('gl');
    } else {
      setLang('es');
    }
  }, [pathname]);

  const loadingText = lang === 'gl' ? 'Recompilando manuscritos...' : 'Recopilando manuscritos...';

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Un indicador visual minimalista tipo editorial */}
        <div className="w-12 h-12 border border-lines flex items-center justify-center animate-pulse text-charcoal/30">
          <span className="text-2xl font-serif">¶</span>
        </div>
        <p className="font-sans text-sm uppercase tracking-widest text-charcoal/60">
          {loadingText}
        </p>
      </div>
    </div>
  );
}
