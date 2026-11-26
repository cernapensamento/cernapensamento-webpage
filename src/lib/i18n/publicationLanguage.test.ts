import { describe, it, expect } from 'vitest';
import {
  hasMeaningfulHtmlContent,
  getAvailablePublicationLocales,
  isMonolingualPublication,
  isBilingualPublication,
  getPublicationLanguageMode,
  resolvePublicationLocale,
} from './publicationLanguage';

describe('publicationLanguage domain helper', () => {
  describe('hasMeaningfulHtmlContent', () => {
    it('returns false for empty, whitespace, or empty TipTap markup', () => {
      expect(hasMeaningfulHtmlContent(null)).toBe(false);
      expect(hasMeaningfulHtmlContent(undefined)).toBe(false);
      expect(hasMeaningfulHtmlContent('')).toBe(false);
      expect(hasMeaningfulHtmlContent('   \n\t  ')).toBe(false);
      expect(hasMeaningfulHtmlContent('<p></p>')).toBe(false);
      expect(hasMeaningfulHtmlContent('<p>   </p>')).toBe(false);
      expect(hasMeaningfulHtmlContent('<p><br></p>')).toBe(false);
      expect(hasMeaningfulHtmlContent('<p><br /></p>')).toBe(false);
      expect(hasMeaningfulHtmlContent('<p>&nbsp;</p>')).toBe(false);
      expect(hasMeaningfulHtmlContent('<div><p> &nbsp; </p></div>')).toBe(false);
    });

    it('returns true for text, images, embeds, math blocks, and tables', () => {
      expect(hasMeaningfulHtmlContent('<p>Ola mundo</p>')).toBe(true);
      expect(hasMeaningfulHtmlContent('<p><img src="https://example.com/a.webp" /></p>')).toBe(true);
      expect(hasMeaningfulHtmlContent('<iframe src="https://www.youtube.com/embed/abc"></iframe>')).toBe(true);
      expect(hasMeaningfulHtmlContent('<span data-type="math" data-latex="E=mc^2"></span>')).toBe(true);
      expect(hasMeaningfulHtmlContent('<div class="katex"></div>')).toBe(true);
      expect(hasMeaningfulHtmlContent('<table><tr><td></td></tr></table>')).toBe(true);
      expect(hasMeaningfulHtmlContent('<figure><img src="/x.webp"></figure>')).toBe(true);
    });
  });

  describe('getAvailablePublicationLocales & classification', () => {
    it('detects a Galician-only Monolingual Publication from title alone (listings)', () => {
      const pub = { title: { gl: 'Ensaio en galego' } };
      expect(getAvailablePublicationLocales(pub)).toEqual(['gl']);
      expect(isMonolingualPublication(pub)).toBe(true);
      expect(isBilingualPublication(pub)).toBe(false);
      expect(getPublicationLanguageMode(pub)).toBe('monolingual');
    });

    it('detects a Spanish-only Monolingual Publication from title alone', () => {
      const pub = { title: { es: 'Ensayo en español' } };
      expect(getAvailablePublicationLocales(pub)).toEqual(['es']);
      expect(isMonolingualPublication(pub)).toBe(true);
      expect(isBilingualPublication(pub)).toBe(false);
      expect(getPublicationLanguageMode(pub)).toBe('monolingual');
    });

    it('detects a Bilingual Publication when both gl and es are populated', () => {
      const pub = {
        title: { gl: 'Título GL', es: 'Título ES' },
        content: { gl: '<p>GL</p>', es: '<p>ES</p>' },
      };
      expect(getAvailablePublicationLocales(pub)).toEqual(['gl', 'es']);
      expect(isMonolingualPublication(pub)).toBe(false);
      expect(isBilingualPublication(pub)).toBe(true);
      expect(getPublicationLanguageMode(pub)).toBe('bilingual');
    });

    it('detects an untitled single-language draft from meaningful content', () => {
      const pub = {
        title: {},
        content: { gl: '<p></p>', es: '<p>Borrador sin título</p>' },
      };
      expect(getAvailablePublicationLocales(pub)).toEqual(['es']);
      expect(isMonolingualPublication(pub)).toBe(true);
    });

    it('returns empty array when neither title nor meaningful content exists', () => {
      const pub = { title: { gl: '   ' }, content: { gl: '<p></p>', es: '<p><br></p>' } };
      expect(getAvailablePublicationLocales(pub)).toEqual([]);
      expect(isMonolingualPublication(pub)).toBe(false);
      expect(isBilingualPublication(pub)).toBe(false);
    });
  });

  describe('resolvePublicationLocale', () => {
    it('marks matching locale as native (isFallback: false) for Monolingual Publication', () => {
      const pub = { title: { es: 'Solo español' }, original_language: 'es' };
      expect(resolvePublicationLocale(pub, 'es')).toEqual({
        actualLocale: 'es',
        availableLocales: ['es'],
        isMonolingual: true,
        isFallback: false,
      });
    });

    it('marks alternate locale as fallback (isFallback: true) for Monolingual Publication', () => {
      const pub = { title: { es: 'Solo español' }, original_language: 'es' };
      expect(resolvePublicationLocale(pub, 'gl')).toEqual({
        actualLocale: 'es',
        availableLocales: ['es'],
        isMonolingual: true,
        isFallback: true,
      });
    });

    it('marks both locales as native for Bilingual Publication', () => {
      const pub = { title: { gl: 'GL', es: 'ES' }, original_language: 'gl' };
      expect(resolvePublicationLocale(pub, 'es')).toEqual({
        actualLocale: 'es',
        availableLocales: ['gl', 'es'],
        isMonolingual: false,
        isFallback: false,
      });
    });
  });
});
