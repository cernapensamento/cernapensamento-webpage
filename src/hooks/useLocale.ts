import { usePathname } from 'next/navigation';
import { Locale, i18n } from '@/i18n-config';

export function useLocale(): Locale {
  const pathname = usePathname();
  if (!pathname) return i18n.defaultLocale;
  const match = pathname.match(/^\/([^/]+)/);
  if (match && (i18n.locales as readonly string[]).includes(match[1])) {
    return match[1] as Locale;
  }
  return i18n.defaultLocale;
}
