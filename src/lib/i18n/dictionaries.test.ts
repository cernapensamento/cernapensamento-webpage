import { describe, it, expect } from 'vitest';
import { getDictionary } from '@/dictionaries';
import { getDictionaryClient } from '@/dictionaries/client';

describe('Dictionary loading and fallback', () => {
  it('loads gl dictionary on server', async () => {
    const dict = await getDictionary('gl');
    expect(dict.nav.articulos).toBe('Arquivo');
    expect(dict.common.readMore).toBe('Ler máis');
  });

  it('loads es dictionary on server with deep merge', async () => {
    const dict = await getDictionary('es');
    expect(dict.nav.articulos).toBe('Archivo');
    expect(dict.common.readMore).toBe('Leer más');
  });

  it('falls back to default locale (gl) when given an unknown locale on server', async () => {
    const dict = await getDictionary('non-existent-locale');
    expect(dict.nav.articulos).toBe('Arquivo');
  });

  it('loads gl and es on client correctly', () => {
    const gl = getDictionaryClient('gl');
    expect(gl.nav.articulos).toBe('Arquivo');

    const es = getDictionaryClient('es');
    expect(es.nav.articulos).toBe('Archivo');
  });

  it('falls back to gl on client when given undefined or unknown locale', () => {
    const fallback1 = getDictionaryClient(undefined);
    expect(fallback1.nav.articulos).toBe('Arquivo');

    const fallback2 = getDictionaryClient('fr');
    expect(fallback2.nav.articulos).toBe('Arquivo');
  });

  it('exposes matching tags dictionary keys in gl and es without legacy themes keys', async () => {
    const gl = await getDictionary('gl');
    const es = await getDictionary('es');

    expect('themes' in gl).toBe(false);
    expect('themes' in es).toBe(false);

    const expectedKeys = ['exploreButton', 'list', 'searchPrompt', 'tag', 'title'];
    expect(Object.keys(gl.tags).sort()).toEqual(expectedKeys);
    expect(Object.keys(es.tags).sort()).toEqual(expectedKeys);
  });
});
