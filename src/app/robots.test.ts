import { describe, it, expect } from 'vitest';
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
});
