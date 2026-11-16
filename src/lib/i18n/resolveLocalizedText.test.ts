import { describe, it, expect } from 'vitest';
import { resolveLocalizedText } from './resolveLocalizedText';

describe('resolveLocalizedText utility', () => {
  it('returns empty string for null or undefined input', () => {
    expect(resolveLocalizedText(null, 'gl')).toBe('');
    expect(resolveLocalizedText(undefined, 'es')).toBe('');
  });

  it('returns raw string if value is already a string', () => {
    expect(resolveLocalizedText('Hello World' as unknown as Record<string, string>, 'gl')).toBe('Hello World');
  });

  it('returns requested language text when available', () => {
    const data = { gl: 'Galego', es: 'Castellano', pt: 'Português' };
    expect(resolveLocalizedText(data, 'pt')).toBe('Português');
    expect(resolveLocalizedText(data, 'es')).toBe('Castellano');
    expect(resolveLocalizedText(data, 'gl')).toBe('Galego');
  });

  it('falls back to defaultLocale (gl) when requested language is missing or empty', () => {
    const data = { gl: 'Texto en galego', es: '' };
    expect(resolveLocalizedText(data, 'es')).toBe('Texto en galego');
    expect(resolveLocalizedText(data, 'fr')).toBe('Texto en galego');
  });

  it('falls back to any available language if both requested and default are missing', () => {
    const data = { gl: '', es: '', pt: 'Texto alternativo' };
    expect(resolveLocalizedText(data, 'fr')).toBe('Texto alternativo');
  });

  it('returns empty string if all languages in object are empty or whitespace', () => {
    const data: Record<string, string | null> = { gl: '  ', es: '', pt: null };
    expect(resolveLocalizedText(data as unknown as Record<string, string>, 'gl')).toBe('');
  });
});
