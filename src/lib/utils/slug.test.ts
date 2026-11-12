import { describe, it, expect } from 'vitest';
import {
  slugify,
  generateRandomSuffix,
  isPlaceholderSlug,
  extractSlugSuffix,
  generatePublicationSlug,
  updatePublicationSlugIfNeeded,
} from './slug';

describe('slug utilities', () => {
  describe('slugify', () => {
    it('removes accents and special characters and formats with hyphens', () => {
      expect(slugify('A bela dormente e a certeza de ter razón!')).toBe(
        'a-bela-dormente-e-a-certeza-de-ter-razon'
      );
      expect(slugify('  ¿Por qué la economía importa?  ')).toBe(
        'por-que-la-economia-importa'
      );
    });

    it('handles multiple consecutive spaces and dashes', () => {
      expect(slugify('foo --- bar   baz')).toBe('foo-bar-baz');
    });

    it('returns empty string for empty input', () => {
      expect(slugify('')).toBe('');
      expect(slugify('   ')).toBe('');
    });
  });

  describe('generateRandomSuffix', () => {
    it('generates an alphanumeric string of the requested length', () => {
      const suffix = generateRandomSuffix(6);
      expect(suffix).toHaveLength(6);
      expect(/^[a-z0-9]{6}$/.test(suffix)).toBe(true);
    });
  });

  describe('isPlaceholderSlug', () => {
    it('identifies placeholder slugs', () => {
      expect(isPlaceholderSlug(null)).toBe(true);
      expect(isPlaceholderSlug('')).toBe(true);
      expect(isPlaceholderSlug('novo-artigo-123456')).toBe(true);
      expect(isPlaceholderSlug('sen-titulo-abcdef')).toBe(true);
      expect(isPlaceholderSlug('sin-titulo-abcdef')).toBe(true);
      expect(isPlaceholderSlug('untitled-xyz123')).toBe(true);
    });

    it('returns false for meaningful real slugs', () => {
      expect(isPlaceholderSlug('en-defensa-do-especulador-2liao2')).toBe(false);
      expect(isPlaceholderSlug('o-futuro-da-moeda-xyz123')).toBe(false);
    });
  });

  describe('extractSlugSuffix', () => {
    it('extracts 6-character suffix from a slug', () => {
      expect(extractSlugSuffix('o-que-queda-de-nos-o3z4bm')).toBe('o3z4bm');
      expect(extractSlugSuffix('artigo-xyz123')).toBe('xyz123');
    });

    it('returns null if slug does not end with 6 alphanumeric chars after hyphen', () => {
      expect(extractSlugSuffix('artigo-short')).toBe(null);
      expect(extractSlugSuffix('artigo')).toBe(null);
      expect(extractSlugSuffix(null)).toBe(null);
    });
  });

  describe('generatePublicationSlug', () => {
    it('creates a formatted slug with a 6-character suffix', () => {
      const slug = generatePublicationSlug('Crítica da Razón Pura');
      expect(slug).toMatch(/^critica-da-razon-pura-[a-z0-9]{6}$/);
    });

    it('falls back to "artigo" if title is empty', () => {
      const slug = generatePublicationSlug('');
      expect(slug).toMatch(/^artigo-[a-z0-9]{6}$/);
    });
  });

  describe('updatePublicationSlugIfNeeded', () => {
    it('updates slug and preserves existing suffix when isDraft is true', () => {
      const updated = updatePublicationSlugIfNeeded(
        'Novo Título Modificado',
        'antigo-titulo-a1b2c3',
        true
      );
      expect(updated).toBe('novo-titulo-modificado-a1b2c3');
    });

    it('updates placeholder slug even if isDraft is false', () => {
      const updated = updatePublicationSlugIfNeeded(
        'Título Real',
        'novo-artigo-123456',
        false
      );
      expect(updated).toBe('titulo-real-123456');
    });

    it('preserves existing slug when published and not a placeholder', () => {
      const existing = 'artigo-xa-publicado-f7g8h9';
      const updated = updatePublicationSlugIfNeeded(
        'Outro Título Calquera',
        existing,
        false
      );
      expect(updated).toBe(existing);
    });

    it('generates a new slug if existing slug is missing', () => {
      const updated = updatePublicationSlugIfNeeded('Artigo Novo', null, true);
      expect(updated).toMatch(/^artigo-novo-[a-z0-9]{6}$/);
    });
  });
});
