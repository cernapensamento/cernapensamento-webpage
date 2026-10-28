import fs from 'fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDocument } from './content';

afterEach(() => vi.restoreAllMocks());

describe('getDocument content boundary', () => {
  it.each([
    ['../../outside', 'gl'],
    ['/tmp/outside', 'es'],
    ['privacidad', '../../../outside'],
    ['../content-other/private', 'gl'],
  ])('rejects a file outside the content root: %s / %s', (slug, lang) => {
    const readFile = vi.spyOn(fs, 'readFileSync');
    expect(getDocument(slug, lang)).toEqual({ data: {}, content: '' });
    expect(readFile).not.toHaveBeenCalled();
  });

  it('still reads documents inside the root', () => {
    expect(getDocument('privacidad', 'es').content).toContain('Cambados');
    expect(getDocument('coleccion-ensayos', 'gl').content.length).toBeGreaterThan(0);
  });

  it('keeps the empty result for missing files', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(getDocument('missing-document', 'gl')).toEqual({ data: {}, content: '' });
  });
});
