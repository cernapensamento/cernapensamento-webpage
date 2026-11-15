import { Suspense } from 'react';
import type { Metadata } from 'next';
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
import { getOpenGraphLocale, i18n, resolveLocale } from '@/i18n-config';
import { getAllTagsWithTranslations } from '@/lib/db';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const dict = await getDictionary(locale);
  const siteUrl = 'https://cernapensamento.org';
  const pageUrl = `${siteUrl}/${locale}`;

  const title = dict.homepage.title;
  const description = dict.homepage.description;

  return {
    title,
    description,
    keywords: [
      'Cerna',
      'Cerna Pensamento',
      'Cerna literary journal',
      'revista literaria',
      'ensaio galego',
      'filosofía política',
      'escola austríaca',
      'Galicia',
      'literary journal Galicia',
      'cultural magazine',
    ],
    alternates: {
      canonical: pageUrl,
      languages: {
        ...Object.fromEntries(i18n.locales.map((loc) => [loc, `${siteUrl}/${loc}`])),
        'x-default': `${siteUrl}/${i18n.defaultLocale}`,
      },
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Cerna Pensamento',
      locale: getOpenGraphLocale(locale),
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/logo/screen.png`,
          width: 1200,
          height: 630,
          alt: dict.homepage.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/images/logo/screen.png`],
    },
  };
}

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const [dict, tags] = await Promise.all([
    getDictionary(locale),
    getAllTagsWithTranslations({ lang: locale }),
  ]);
  const themesTags = tags.slice(0, 12);
  const siteUrl = 'https://cernapensamento.org';

  // Schema.org JSON-LD Structured Data (Organization + NewsMediaOrganization + Periodical + WebSite)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'NewsMediaOrganization', 'Periodical'],
        '@id': 'https://cernapensamento.org/#organization',
        name: 'Asociación Cerna Pensamento',
        alternateName: [
          'Cerna',
          'Cerna Pensamento',
          'Cerna Revista Literaria',
          'Cerna Literary Journal',
        ],
        url: 'https://cernapensamento.org',
        logo: {
          '@type': 'ImageObject',
          url: 'https://cernapensamento.org/images/logo/cernablack.png',
          width: 430,
          height: 159,
        },
        image: 'https://cernapensamento.org/images/logo/screen.png',
        description: dict.homepage.organizationDescription,
        email: 'contacto@cernapensamento.org',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            email: 'contacto@cernapensamento.org',
            contactType: 'editorial',
            availableLanguage: ['Galician', 'Spanish', 'English'],
          },
        ],
        sameAs: [
          'https://www.instagram.com/cernapensamento',
          'https://github.com/cernapensamento/cernapensamento-webpage',
        ],
        foundingLocation: {
          '@type': 'Place',
          name: 'Galicia, España',
        },
        publishingPrinciples: `${siteUrl}/${locale}/asociacion`,
      },
      {
        '@type': 'WebSite',
        '@id': 'https://cernapensamento.org/#website',
        url: 'https://cernapensamento.org',
        name: 'Cerna Pensamento',
        description: dict.homepage.websiteDescription,
        publisher: {
          '@id': 'https://cernapensamento.org/#organization',
        },
        inLanguage: [...i18n.locales],
      },
    ],
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. HERO INTRO SECTION (White / Black: bg-parchment) */}
      <HeroIntroSection lang={locale} dict={dict.hero} />

      {/* 2. ARTICLES MOSAIC SECTION (Grey / Dark-Grey: bg-surface) */}
      <section
        aria-label={dict.mosaic?.recentTitle || dict.articles?.title}
        className="flex-grow w-full bg-surface border-b border-lines py-16 sm:py-24"
      >
        <div className="max-w-[1120px] mx-auto px-5 md:px-16">
          <Suspense fallback={<ArticlesMosaicSkeleton />}>
            <ArticlesMosaicLoader lang={locale} dict={dict} />
          </Suspense>
        </div>
      </section>

      {/* 3. ASSOCIATION & NEWS SECTION (White / Black: bg-parchment) */}
      <AssociationAndNewsSection lang={locale} dict={dict.associationAndNews} />

      {/* 4. ABOUT US SECTION (Grey / Dark-Grey: bg-surface) */}
      <AboutUsSection lang={locale} dict={dict.about} />

      {/* 5. THEMES CAROUSEL OF TAGS (White / Black: bg-parchment) */}
      <RevealOnScroll delayMs={50}>
        <ThemesSection lang={locale} dict={dict.themes} tags={themesTags} />
      </RevealOnScroll>

      {/* 6. COLUMNISTS / AUTHORS SECTION (Grey / Dark-Grey: bg-surface) */}
      <RevealOnScroll delayMs={50}>
        <ColumnistsSection
          lang={locale}
          dict={{ columnists: dict.columnists, authors: dict.authors }}
        />
      </RevealOnScroll>

      {/* 7. FAQ SECTION (White / Black: bg-parchment) */}
      <RevealOnScroll delayMs={50}>
        <FAQSection dict={dict.faq} lang={locale} />
      </RevealOnScroll>

      {/* 8. CONTACT SECTION (Grey / Dark-Grey: bg-surface) */}
      <ContactSection lang={locale} dict={dict.contact} />
    </>
  );
}
