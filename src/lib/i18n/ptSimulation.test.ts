import { describe, it, expect } from 'vitest';
import { resolveLocalizedText } from './resolveLocalizedText';
import { deepMerge } from './deepMerge';
import glDict from '@/dictionaries/gl.json';

describe('Modular i18n scalability test (Simulating a 3rd locale e.g. "pt")', () => {
  it('deep merges a partial Portuguese dictionary onto default Galician base', () => {
    const ptPartial = {
      nav: {
        articulos: 'Artigos',
      },
    };

    const merged = deepMerge(glDict, ptPartial);

    // Overridden key
    expect(merged.nav.articulos).toBe('Artigos');
    // Fallback keys preserved from gl
    expect(merged.nav.asociacion).toBe(glDict.nav.asociacion);
    expect(merged.common.readMore).toBe(glDict.common.readMore);
  });

  it('resolves localized content dynamically for the 3rd locale with fallback', () => {
    const articleTitle = {
      gl: 'Título en Galego',
      es: 'Título en Castellano',
      pt: 'Título em Português',
    };

    // When pt is requested
    expect(resolveLocalizedText(articleTitle, 'pt')).toBe('Título em Português');

    // When pt is absent or empty in another field
    const articleSubtitle = {
      gl: 'Subtítulo en Galego',
      es: 'Subtítulo en Castellano',
    };
    expect(resolveLocalizedText(articleSubtitle, 'pt')).toBe('Subtítulo en Galego');
  });
});
