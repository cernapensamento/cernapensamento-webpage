'use client';

import { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { i18n, isSupportedLocale } from '@/i18n-config';
import { getDictionaryClient } from '@/dictionaries/client';

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

    // Create new pathname by replacing the current locale segment when present
    const segments = pathname.split('/');
    const newPathname = isSupportedLocale(segments[1])
      ? [segments[0], newLocale, ...segments.slice(2)].join('/')
      : `/${newLocale}${pathname === '/' ? '' : pathname}`;

    startTransition(() => {
      router.push(newPathname);
    });
  };

  if (!currentLocale) return <div className="w-10 h-10 border border-lines bg-parchment" />; // Skeleton

  const currentIndex = i18n.locales.indexOf(currentLocale);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % i18n.locales.length : 0;
  const nextLocale = i18n.locales[nextIndex];
  const nextLabel = i18n.localeLabels[nextLocale] || nextLocale.toUpperCase();
  const dict = getDictionaryClient(currentLocale);
  const switchLabel = `${dict.nav.switchLanguageTo} ${nextLabel}`;

  return (
    <button
      type="button"
      onClick={() => switchLocale(nextLocale)}
      disabled={isPending}
      className="border border-lines bg-parchment text-charcoal hover:bg-lines transition-colors duration-300 flex items-center justify-center w-10 h-10 shadow-lg text-xs font-serif font-bold tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      aria-label={switchLabel}
      title={switchLabel}
    >
      {currentLocale.toUpperCase()}
    </button>
  );
}
