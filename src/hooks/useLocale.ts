import { usePathname } from 'next/navigation';
import { Locale, i18n, isSupportedLocale } from '@/i18n-config';

export function useLocale(): Locale {
  const pathname = usePathname();
  const segment = pathname?.split('/')[1];

  if (isSupportedLocale(segment)) return segment;

  return i18n.defaultLocale;
}
