import { describe, it, expect } from 'vitest';
import { generateMetadata } from './page';
import { getDictionary } from '@/dictionaries';

describe('Homepage Metadata & Agent Readiness', () => {
  it('generates complete metadata with all 4 signals (canonical, og:image, og:type, brand discovery)', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ lang: 'gl' }) });

    // Brand discoverability
    expect(meta.title).toContain('Cerna Pensamento');
    expect(meta.title).toContain('Revista');

    // Canonical signal
    expect(meta.alternates?.canonical).toBe('https://cernapensamento.org/gl');
    expect((meta.alternates?.languages as Record<string, string>)?.gl).toBe('https://cernapensamento.org/gl');
    expect((meta.alternates?.languages as Record<string, string>)?.es).toBe('https://cernapensamento.org/es');

    // OpenGraph signals: type and image
    expect(meta.openGraph?.type).toBe('website');
    expect(meta.openGraph?.images).toBeDefined();
    const images = meta.openGraph?.images as Array<{ url: string | URL }>;
    expect(images[0]?.url).toContain('/images/logo/screen.png');

    // Keywords include brand name discoverability terms
    const keywords = meta.keywords as string[];
    expect(keywords).toContain('Cerna literary journal');
    expect(keywords).toContain('Cerna Pensamento');
  });

  it('generates localized spanish metadata when lang is es', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ lang: 'es' }) });
    expect(meta.alternates?.canonical).toBe('https://cernapensamento.org/es');
    expect(meta.openGraph?.locale).toBe('es_ES');
  });

  it.each(['gl', 'es'] as const)('uses the selected dictionary for %s descriptions', async (lang) => {
    const dict = await getDictionary(lang);
    const meta = await generateMetadata({ params: Promise.resolve({ lang }) });
    expect(meta.description).toBe(dict.homepage.description);
    expect(meta.openGraph?.description).toBe(dict.homepage.description);
    expect(meta.twitter?.description).toBe(dict.homepage.description);
  });

});
