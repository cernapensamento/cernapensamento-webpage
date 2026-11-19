import { Suspense } from 'react';
import type { Metadata } from 'next';
import HeroIntroSection from '@/components/sections/HeroIntroSection';
import ArticlesMosaicLoader from '@/components/sections/ArticlesMosaicLoader';
import ArticlesMosaicSkeleton from '@/components/sections/ArticlesMosaicSkeleton';
import AssociationAndNewsSection from '@/components/sections/AssociationAndNewsSection';
import ColumnistsSection from '@/components/sections/ColumnistsSection';
import AboutUsSection from '@/components/sections/AboutUsSection';
import TagsSection from '@/components/sections/TagsSection';
import FAQSection from '@/components/sections/FAQSection';
import ContactSection from '@/components/sections/ContactSection';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { getDictionary } from '@/dictionaries';
import { getOpenGraphLocale, i18n, resolveLocale } from '@/i18n-config';
import { SITE_FULL_NAME, SITE_URL } from '@/lib/constants';
import { getAllTagsWithTranslations } from '@/lib/db';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const dict = await getDictionary(locale);
  const pageUrl = `${SITE_URL}/${locale}`;

  const title = dict.homepage.title;
  const description = dict.homepage.description;

  return {
    title,
    description,
    keywords: dict.homepage.keywords,
    alternates: {
      canonical: pageUrl,
      languages: {
        ...Object.fromEntries(i18n.locales.map((loc) => [loc, `${SITE_URL}/${loc}`])),
        'x-default': `${SITE_URL}/${i18n.defaultLocale}`,
      },
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_FULL_NAME,
      locale: getOpenGraphLocale(locale),
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/images/logo/screen.png`,
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
      images: [`${SITE_URL}/images/logo/screen.png`],
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

  // Schema.org JSON-LD Structured Data (Organization + NewsMediaOrganization + Periodical + WebSite)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'NewsMediaOrganization', 'Periodical'],
        '@id': `${SITE_URL}/#organization`,
        name: `Asociación ${SITE_FULL_NAME}`,
        alternateName: [
          'Cerna',
          SITE_FULL_NAME,
          'Cerna Revista Literaria',
          'Cerna Literary Journal',
        ],
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/images/logo/cernablack.png`,
          width: 430,
          height: 159,
        },
        image: `${SITE_URL}/images/logo/screen.png`,
        description: dict.homepage.organizationDescription,
        email: dict.contact.email,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            email: dict.contact.email,
            contactType: 'editorial',
            availableLanguage: [...i18n.locales],
          },
        ],
        sameAs: [
          'https://www.instagram.com/cernapensamento',
          'https://github.com/cernapensamento/cernapensamento-webpage',
        ],
        foundingLocation: {
          '@type': 'Place',
          name: dict.footer.location,
        },
        publishingPrinciples: `${SITE_URL}/${locale}/asociacion`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_FULL_NAME,
        description: dict.homepage.websiteDescription,
        publisher: {
          '@id': `${SITE_URL}/#organization`,
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
        aria-label={dict.mosaic.recentTitle}
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

      {/* 5. TAGS MARQUEE SECTION (White / Black: bg-parchment) */}
      <RevealOnScroll delayMs={50}>
        <TagsSection lang={locale} dict={dict.tags} tags={tags} />
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
