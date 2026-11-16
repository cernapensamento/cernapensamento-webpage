import { describe, it, expect } from 'vitest';
import { generateMetadata } from './page';
import { getDictionary } from '@/dictionaries';
import { getOpenGraphLocale, i18n } from '@/i18n-config';
import { SITE_FULL_NAME, SITE_URL } from '@/lib/constants';

describe('Homepage Metadata & Agent Readiness', () => {
  it('generates complete metadata with all 4 signals (canonical, og:image, og:type, brand discovery)', async () => {
    const dict = await getDictionary(i18n.defaultLocale);
    const meta = await generateMetadata({
      params: Promise.resolve({ lang: i18n.defaultLocale }),
    });

    // Brand discoverability
    expect(meta.title).toContain(SITE_FULL_NAME);
    expect(meta.title).toContain('Revista');

    // Canonical signal
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/${i18n.defaultLocale}`);
    const languages = meta.alternates?.languages as Record<string, string>;
    for (const loc of i18n.locales) {
      expect(languages?.[loc]).toBe(`${SITE_URL}/${loc}`);
    }

    // OpenGraph signals: type and image
    expect((meta.openGraph as Record<string, unknown>)?.type).toBe('website');
    expect(meta.openGraph?.images).toBeDefined();
    const images = meta.openGraph?.images as Array<{ url: string | URL }>;
    expect(images[0]?.url).toContain('/images/logo/screen.png');

    // Keywords include brand name discoverability terms from dictionary
    const keywords = meta.keywords as string[];
    expect(keywords).toEqual(dict.homepage.keywords);
    expect(keywords).toContain(SITE_FULL_NAME);
  });

  it.each(i18n.locales)(
    'generates localized canonical, OpenGraph locale, and dictionary fields for %s',
    async (lang) => {
      const dict = await getDictionary(lang);
      const meta = await generateMetadata({ params: Promise.resolve({ lang }) });
      expect(meta.alternates?.canonical).toBe(`${SITE_URL}/${lang}`);
      expect(meta.openGraph?.locale).toBe(getOpenGraphLocale(lang));
      expect(meta.description).toBe(dict.homepage.description);
      expect(meta.openGraph?.description).toBe(dict.homepage.description);
      expect(meta.twitter?.description).toBe(dict.homepage.description);
      expect(meta.keywords).toEqual(dict.homepage.keywords);
    }
  );
});
