import { describe, it, expect } from 'vitest';
import { formatArticleDate, GL_SHORT_MONTHS, ES_SHORT_MONTHS, GL_LONG_MONTHS, ES_LONG_MONTHS } from './date';

describe('formatArticleDate', () => {
  it('formats Galician short date correctly (e.g. 26 de out. de 2026)', () => {
    const res = formatArticleDate('2026-10-26T19:18:26.079445+00:00', 'gl');
    expect(res).toBe('26 de out. de 2026');
  });

  it('formats Spanish short date correctly (e.g. 26 oct 2026)', () => {
    const res = formatArticleDate('2026-10-26T19:18:26.079445+00:00', 'es');
    expect(res).toBe('26 oct 2026');
  });

  it('formats Galician long date correctly', () => {
    const res = formatArticleDate('2026-10-26T19:18:26.079445+00:00', 'gl', { format: 'long' });
    expect(res).toBe('26 de outubro de 2026');
  });

  it('formats Spanish long date correctly', () => {
    const res = formatArticleDate('2026-10-26T19:18:26.079445+00:00', 'es', { format: 'long' });
    expect(res).toBe('26 de octubre de 2026');
  });

  it('correctly handles all 12 months for Galician and Spanish', () => {
    for (let m = 0; m < 12; m++) {
      const iso = new Date(Date.UTC(2026, m, 15)).toISOString();
      
      const glShort = formatArticleDate(iso, 'gl');
      expect(glShort).toBe(`15 de ${GL_SHORT_MONTHS[m]} de 2026`);

      const esShort = formatArticleDate(iso, 'es');
      expect(esShort).toBe(`15 ${ES_SHORT_MONTHS[m]} 2026`);

      const glLong = formatArticleDate(iso, 'gl', { format: 'long' });
      expect(glLong).toBe(`15 de ${GL_LONG_MONTHS[m]} de 2026`);

      const esLong = formatArticleDate(iso, 'es', { format: 'long' });
      expect(esLong).toBe(`15 de ${ES_LONG_MONTHS[m]} de 2026`);
    }
  });

  it('accepts Date objects and timestamps', () => {
    const dateObj = new Date(Date.UTC(2026, 4, 1));
    expect(formatArticleDate(dateObj, 'gl')).toBe('1 de maio de 2026');
    expect(formatArticleDate(dateObj.getTime(), 'es')).toBe('1 may 2026');
  });

  it('accepts regional locale codes like gl-ES and es-ES', () => {
    expect(formatArticleDate('2026-01-01T00:00:00Z', 'gl-ES')).toBe('1 de xan. de 2026');
    expect(formatArticleDate('2026-01-01T00:00:00Z', 'es-ES')).toBe('1 ene 2026');
  });

  it('gracefully handles empty, null, undefined, and invalid inputs', () => {
    expect(formatArticleDate(null, 'gl')).toBe('');
    expect(formatArticleDate(undefined, 'es')).toBe('');
    expect(formatArticleDate('', 'gl')).toBe('');
    expect(formatArticleDate('invalid-date-string', 'gl')).toBe('');
  });
});
