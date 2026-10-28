'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

export default function BackButton() {
  const pathname = usePathname();
  const lang = useLocale();
  const dict = getDictionaryClient(lang);

  if (pathname === '/' || pathname === `/${lang}`) return null;

  return (
    <Link 
      href={`/${lang}`} 
      className="text-charcoal/50 hover:text-charcoal transition-colors font-serif text-2xl shrink-0 cursor-pointer" 
      aria-label={dict.loginPage?.backToHome || 'Volver ao inicio'}
      title={dict.loginPage?.backToHome || 'Volver ao inicio'}
    >
      ←
    </Link>
  );
}
