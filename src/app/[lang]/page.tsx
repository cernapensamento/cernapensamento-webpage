import { Suspense } from 'react';
import ArticlesMosaicLoader from '@/components/sections/ArticlesMosaicLoader';
import ArticlesMosaicSkeleton from '@/components/sections/ArticlesMosaicSkeleton';
import AssociationAndNewsSection from '@/components/sections/AssociationAndNewsSection';
import ColumnistsSection from '@/components/sections/ColumnistsSection';
import AboutUsSection from '@/components/sections/AboutUsSection';
import ThemesSection from '@/components/sections/ThemesSection';
import FAQSection from '@/components/sections/FAQSection';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';

export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <>
      <main className="flex-grow w-full max-w-[1120px] mx-auto px-5 md:px-16 pt-10 pb-20 sm:pb-28">
        <Suspense fallback={<ArticlesMosaicSkeleton />}>
          <ArticlesMosaicLoader lang={lang} dict={dict} />
        </Suspense>
      </main>

      <AssociationAndNewsSection lang={lang} />

      <RevealOnScroll delayMs={50}>
        <AboutUsSection lang={lang} dict={dict.about} />
      </RevealOnScroll>

      <RevealOnScroll delayMs={50}>
        <ThemesSection lang={lang} dict={dict.themes} />
      </RevealOnScroll>

      <RevealOnScroll delayMs={50}>
        <ColumnistsSection lang={lang} dict={{ columnists: dict.columnists, authors: dict.authors }} />
      </RevealOnScroll>

      <RevealOnScroll delayMs={50}>
        <FAQSection dict={dict.faq} lang={lang} />
      </RevealOnScroll>
    </>
  );
}
