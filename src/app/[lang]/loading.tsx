'use client';

import React from 'react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

export default function Loading() {
  const lang = useLocale();
  const dict = getDictionaryClient(lang);

  return (
    <div className="fixed inset-0 z-40 bg-parchment flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Un indicador visual minimalista tipo editorial */}
        <div className="w-12 h-12 border border-lines flex items-center justify-center animate-pulse text-charcoal/30">
          <span className="text-2xl font-serif">¶</span>
        </div>
        <p className="font-sans text-sm uppercase tracking-widest text-charcoal/60">
          {dict.loading.message}
        </p>
      </div>
    </div>
  );
}
