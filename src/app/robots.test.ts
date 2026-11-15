import { describe, it, expect } from 'vitest';
import { i18n } from '@/i18n-config';
import robots from './robots';

describe('Robots Generator (src/app/robots.ts)', () => {
  it('returns valid robots configuration with sitemap URL', () => {
    const config = robots();

    expect(config.sitemap).toBe('https://cernapensamento.org/sitemap.xml');
    expect(config.rules).toBeDefined();

    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules.userAgent).toBe('*');
    expect(rules.allow).toBe('/');
  });

  it('disallows desk routes for every locale in i18n.locales alongside core private paths', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;

    expect(rules.disallow).toEqual(
      expect.arrayContaining(['/escritorio', '/escritorio/', '/api/', '/auth/'])
    );

    for (const locale of i18n.locales) {
      expect(rules.disallow).toContain(`/${locale}/escritorio`);
      expect(rules.disallow).toContain(`/${locale}/escritorio/`);
    }
  });
});
