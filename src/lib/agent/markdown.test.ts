import { describe, it, expect } from 'vitest';
import {
  prefersMarkdown,
  get404Markdown,
  getHomepageMarkdown,
  isKnownPath,
} from './markdown';

describe('Agent Markdown Negotiation', () => {
  describe('prefersMarkdown', () => {
    it('returns true when Accept header is text/markdown', () => {
      expect(prefersMarkdown('text/markdown')).toBe(true);
    });

    it('returns true when Accept header prefers text/markdown over text/html', () => {
      expect(prefersMarkdown('text/markdown, text/html;q=0.9')).toBe(true);
      expect(prefersMarkdown('text/markdown;q=1.0, text/html;q=0.8')).toBe(true);
    });

    it('returns false when Accept header prefers text/html over text/markdown', () => {
      expect(prefersMarkdown('text/html, text/markdown;q=0.5')).toBe(false);
    });

    it('returns false for standard browser Accept headers without text/markdown', () => {
      expect(
        prefersMarkdown(
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        )
      ).toBe(false);
    });

    it('returns false when Accept header is null, undefined or empty', () => {
      expect(prefersMarkdown(null)).toBe(false);
      expect(prefersMarkdown(undefined)).toBe(false);
      expect(prefersMarkdown('')).toBe(false);
    });
  });

  describe('get404Markdown', () => {
    it('returns a markdown error body of at least 20 characters with links to sitemap and llms.txt', () => {
      const markdown = get404Markdown('gl');
      expect(markdown.length).toBeGreaterThan(20);
      expect(markdown).toContain('404');
      expect(markdown).toContain('/sitemap.xml');
      expect(markdown).toContain('/llms.txt');
      expect(markdown).toContain('https://cernapensamento.org');
    });

    it('supports es locale', () => {
      const markdown = get404Markdown('es');
      expect(markdown.length).toBeGreaterThan(20);
      expect(markdown).toContain('404');
      expect(markdown).toContain('/sitemap.xml');
      expect(markdown).toContain('/llms.txt');
    });
  });

  describe('getHomepageMarkdown', () => {
    it('returns rich markdown describing Cerna Pensamento with essential navigation links', () => {
      const markdown = getHomepageMarkdown('gl');
      expect(markdown.length).toBeGreaterThan(500);
      expect(markdown).toContain('# Cerna Pensamento');
      expect(markdown).toContain('/gl/articulos');
      expect(markdown).toContain('/gl/asociacion');
      expect(markdown).toContain('/sitemap.xml');
      expect(markdown).toContain('/llms.txt');
    });

    it('returns spanish version when es is requested', () => {
      const markdown = getHomepageMarkdown('es');
      expect(markdown.length).toBeGreaterThan(500);
      expect(markdown).toContain('# Cerna Pensamento');
      expect(markdown).toContain('/es/articulos');
      expect(markdown).toContain('/es/asociacion');
    });
  });

  describe('isKnownPath', () => {
    it('identifies root and localized homepages as known paths', () => {
      expect(isKnownPath('/')).toBe(true);
      expect(isKnownPath('/gl')).toBe(true);
      expect(isKnownPath('/es')).toBe(true);
      expect(isKnownPath('/gl/')).toBe(true);
      expect(isKnownPath('/es/')).toBe(true);
    });

    it('identifies standard localized pages as known paths', () => {
      expect(isKnownPath('/gl/articulos')).toBe(true);
      expect(isKnownPath('/es/articulos')).toBe(true);
      expect(isKnownPath('/gl/asociacion')).toBe(true);
      expect(isKnownPath('/gl/asociacion/estatutos')).toBe(true);
      expect(isKnownPath('/gl/contacto')).toBe(true);
      expect(isKnownPath('/gl/privacidad')).toBe(true);
      expect(isKnownPath('/gl/privacy')).toBe(true);
      expect(isKnownPath('/gl/about')).toBe(true);
      expect(isKnownPath('/gl/contact')).toBe(true);
    });

    it('identifies dynamic article and author routes as known paths', () => {
      expect(isKnownPath('/gl/articulo/algun-artigo')).toBe(true);
      expect(isKnownPath('/es/articulo/algun-articulo')).toBe(true);
      expect(isKnownPath('/gl/autor/diego-araujo')).toBe(true);
    });

    it('identifies system and static assets as known paths', () => {
      expect(isKnownPath('/sitemap.xml')).toBe(true);
      expect(isKnownPath('/robots.txt')).toBe(true);
      expect(isKnownPath('/llms.txt')).toBe(true);
      expect(isKnownPath('/favicon.ico')).toBe(true);
      expect(isKnownPath('/images/logo/screen.png')).toBe(true);
      expect(isKnownPath('/api/contact')).toBe(true);
    });

    it('returns false for arbitrary nonexistent probe paths', () => {
      expect(isKnownPath('/__ora-404-probe-fdnst0c6')).toBe(false);
      expect(isKnownPath('/gl/__ora-404-probe-fdnst0c6')).toBe(false);
      expect(isKnownPath('/some-path-that-does-not-exist')).toBe(false);
      expect(isKnownPath('/gl/random-bad-path-12345')).toBe(false);
      expect(isKnownPath('/not-a-real-page')).toBe(false);
    });
  });
});
