import { describe, it, expect } from 'vitest';
import { renderHeadingAnchors } from './renderHeadingAnchors';

describe('renderHeadingAnchors', () => {
  it('injects slugified id attributes into h1, h2, and h3 headings', () => {
    const input = '<h2>O Rexurdimento Literario</h2><h3>Contexto Histórico</h3>';
    const output = renderHeadingAnchors(input);
    expect(output).toContain('id="o-rexurdimento-literario"');
    expect(output).toContain('id="contexto-historico"');
  });

  it('adds scroll-margin-top style for sticky header compensation', () => {
    const input = '<h2>Introdución</h2>';
    const output = renderHeadingAnchors(input);
    expect(output).toContain('style="scroll-margin-top: 9rem;"');
  });

  it('disambiguates duplicate headings with sequential suffixes', () => {
    const input = '<h2>Conclusión</h2><p>text</p><h2>Conclusión</h2><p>more text</p><h2>Conclusión</h2>';
    const output = renderHeadingAnchors(input);
    expect(output).toContain('id="conclusion"');
    expect(output).toContain('id="conclusion-2"');
    expect(output).toContain('id="conclusion-3"');
  });

  it('strips inner HTML and tags before computing the slug', () => {
    const input = '<h2>A cuestión de <em>Rosalía de Castro</em></h2>';
    const output = renderHeadingAnchors(input);
    expect(output).toContain('id="a-cuestion-de-rosalia-de-castro"');
    expect(output).toContain('<em>Rosalía de Castro</em>');
  });

  it('leaves headings with empty slug content unchanged', () => {
    const input = '<h2>   </h2>';
    const output = renderHeadingAnchors(input);
    expect(output).toBe('<h2>   </h2>');
  });
});
