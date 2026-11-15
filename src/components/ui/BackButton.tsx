'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';
import { isHomepagePath } from '@/lib/routes';

export default function BackButton() {
  const pathname = usePathname();
  const lang = useLocale();
  const dict = getDictionaryClient(lang);

  if (isHomepagePath(pathname || '/')) return null;

  return (
    <Link 
      href={`/${lang}`} 
      className="text-charcoal/50 hover:text-charcoal transition-colors font-serif text-2xl shrink-0 cursor-pointer" 
      aria-label={dict.loginPage.backToHome}
      title={dict.loginPage.backToHome}
    >
      ←
    </Link>
  );
}
