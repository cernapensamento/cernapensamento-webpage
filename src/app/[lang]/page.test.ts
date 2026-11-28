import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import HomePage, { generateMetadata } from './page';
import ColumnistsSection from '@/components/sections/ColumnistsSection';
import OpenPublishingSection from '@/components/sections/OpenPublishingSection';
import TagsSection from '@/components/sections/TagsSection';
import { getDictionary } from '@/dictionaries';
import { getOpenGraphLocale, i18n } from '@/i18n-config';
import { SITE_FULL_NAME, SITE_URL } from '@/lib/constants';
import { USER_ROLES } from '@/lib/db/schema';
import type { ColumnistItem, TagItem } from '@/lib/db/types';

const mockTags: TagItem[] = Array.from({ length: 20 }, (_, idx) => ({
  id: `tag-${idx + 1}`,
  slug: `tag-${idx + 1}`,
  name: `Tag ${idx + 1}`,
}));

const mockAnonClient = { __isAnonClient: true };
const mockColumnists: ColumnistItem[] = [
  {
    id: 'founder-1',
    full_name: 'Diego Araújo',
    slug: 'diego-araujo',
    bio: { gl: 'Ensaísta' },
    avatar_url: null,
    roles: [USER_ROLES.FOUNDER],
  },
];

vi.mock('@/lib/db', () => ({
  createPublicAnonClient: vi.fn(() => mockAnonClient),
  getColumnists: vi.fn(async () => mockColumnists),
  getAllTagsWithTranslations: vi.fn(async () => mockTags),
  getPublicationCards: vi.fn(async () => []),
  getPinnedPublications: vi.fn(async () => []),
}));

function findElementsByType(
  node: React.ReactNode,
  targetType: unknown
): React.ReactElement[] {
  const matches: React.ReactElement[] = [];
  if (!node || typeof node !== 'object') return matches;
  if (Array.isArray(node)) {
    for (const child of node) {
      matches.push(...findElementsByType(child, targetType));
    }
    return matches;
  }
  if (React.isValidElement(node)) {
    if (node.type === targetType) {
      matches.push(node);
    }
    const props = node.props as { children?: React.ReactNode };
    if (props?.children) {
      matches.push(...findElementsByType(props.children, targetType));
    }
  }
  return matches;
}

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

  it('passes all fetched tags (>12) and dict.tags to TagsSection', async () => {
    const dict = await getDictionary('gl');
    const tree = await HomePage({ params: Promise.resolve({ lang: 'gl' }) });
    const tagSections = findElementsByType(tree, TagsSection);

    expect(tagSections).toHaveLength(1);
    const props = tagSections[0].props as {
      lang: string;
      dict: unknown;
      tags: TagItem[];
    };
    expect(props.lang).toBe('gl');
    expect(props.dict).toEqual(dict.tags);
    expect(props.tags).toHaveLength(20);
  });

  it('passes lang and dict.openPublishing to OpenPublishingSection', async () => {
    const dict = await getDictionary('es');
    const tree = await HomePage({ params: Promise.resolve({ lang: 'es' }) });
    const sections = findElementsByType(tree, OpenPublishingSection);

    expect(sections).toHaveLength(1);
    const props = sections[0].props as {
      lang: string;
      dict: unknown;
    };
    expect(props.lang).toBe('es');
    expect(props.dict).toEqual(dict.openPublishing);
  });

  it('fetches DB columnists via createPublicAnonClient and passes them to ColumnistsSection', async () => {
    const dbModule = await import('@/lib/db');
    const tree = await HomePage({ params: Promise.resolve({ lang: 'gl' }) });
    const sections = findElementsByType(tree, ColumnistsSection);

    expect(dbModule.createPublicAnonClient).toHaveBeenCalled();
    expect(dbModule.getColumnists).toHaveBeenCalledWith(mockAnonClient);
    expect(sections).toHaveLength(1);
    const props = sections[0].props as {
      lang: string;
      columnists?: ColumnistItem[];
    };
    expect(props.lang).toBe('gl');
    expect(props.columnists).toEqual(mockColumnists);
  });
});
