import { describe, it, expect } from 'vitest';
import { deepMerge } from './deepMerge';

describe('deepMerge utility', () => {
  it('returns a shallow clone of target if source is null or undefined', () => {
    const target = { a: 1, b: 'test' };
    expect(deepMerge(target, null)).toEqual(target);
    expect(deepMerge(target, undefined)).toEqual(target);
    expect(deepMerge(target, null)).not.toBe(target);
  });

  it('overwrites primitive keys with source values', () => {
    const target = { a: 1, b: 'original' };
    const source = { b: 'updated', c: true };
    expect(deepMerge(target, source)).toEqual({ a: 1, b: 'updated', c: true });
  });

  it('deeply merges nested objects preserving missing keys in source', () => {
    const target = {
      nav: { home: 'Inicio', about: 'Sobre nós', contact: 'Contacto' },
      footer: { copyright: 'Cerna 2026' },
    };
    const source = {
      nav: { about: 'Acerca de' },
    };
    const result = deepMerge(target, source);

    expect(result).toEqual({
      nav: { home: 'Inicio', about: 'Acerca de', contact: 'Contacto' },
      footer: { copyright: 'Cerna 2026' },
    });
  });

  it('does not mutate original objects (immutability)', () => {
    const target = { nested: { val: 1 } };
    const source = { nested: { val: 2 } };
    deepMerge(target, source);

    expect(target.nested.val).toBe(1);
    expect(source.nested.val).toBe(2);
  });
});
