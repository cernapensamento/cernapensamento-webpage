import type { Metadata } from 'next';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: `${dict.nav.asociacion} | Cerna Pensamento`,
    description: dict.associationAndNews.description,
  };
}

export { default } from '../asociacion/page';
