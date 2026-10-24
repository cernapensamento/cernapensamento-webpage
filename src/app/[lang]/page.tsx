import { Suspense } from 'react';
import HeroIntroSection from '@/components/sections/HeroIntroSection';
import ArticlesMosaicLoader from '@/components/sections/ArticlesMosaicLoader';
import ArticlesMosaicSkeleton from '@/components/sections/ArticlesMosaicSkeleton';
import AssociationAndNewsSection from '@/components/sections/AssociationAndNewsSection';
import ColumnistsSection from '@/components/sections/ColumnistsSection';
import AboutUsSection from '@/components/sections/AboutUsSection';
import ThemesSection from '@/components/sections/ThemesSection';
import FAQSection from '@/components/sections/FAQSection';
import ContactSection from '@/components/sections/ContactSection';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';

export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <>
      {/* 1. HERO INTRO SECTION (White / Black: bg-parchment) */}
      <HeroIntroSection lang={lang} dict={dict.hero} />

      {/* 2. ARTICLES MOSAIC SECTION (Grey / Dark-Grey: bg-surface) */}
      <section aria-label="Publicacións recentes" className="flex-grow w-full bg-surface border-b border-lines py-16 sm:py-24">
        <div className="max-w-[1120px] mx-auto px-5 md:px-16">
          <Suspense fallback={<ArticlesMosaicSkeleton />}>
            <ArticlesMosaicLoader lang={lang} dict={dict} />
          </Suspense>
        </div>
      </section>

      {/* 3. ASSOCIATION & NEWS SECTION (White / Black: bg-parchment) */}
      <AssociationAndNewsSection lang={lang} dict={dict.associationAndNews} />

      {/* 4. ABOUT US SECTION (Grey / Dark-Grey: bg-surface) */}
      <RevealOnScroll delayMs={50}>
        <AboutUsSection lang={lang} dict={dict.about} />
      </RevealOnScroll>

      {/* 5. THEMES CAROUSEL OF TAGS (White / Black: bg-parchment) */}
      <RevealOnScroll delayMs={50}>
        <ThemesSection lang={lang} dict={dict.themes} />
      </RevealOnScroll>

      {/* 6. COLUMNISTS / AUTHORS SECTION (Grey / Dark-Grey: bg-surface) */}
      <RevealOnScroll delayMs={50}>
        <ColumnistsSection lang={lang} dict={{ columnists: dict.columnists, authors: dict.authors }} />
      </RevealOnScroll>

      {/* 7. FAQ SECTION (White / Black: bg-parchment) */}
      <RevealOnScroll delayMs={50}>
        <FAQSection dict={dict.faq} lang={lang} />
      </RevealOnScroll>

      {/* 8. CONTACT SECTION (Grey / Dark-Grey: bg-surface) */}
      <RevealOnScroll delayMs={50}>
        <ContactSection lang={lang} dict={dict.contact} />
      </RevealOnScroll>
    </>
  );
}
