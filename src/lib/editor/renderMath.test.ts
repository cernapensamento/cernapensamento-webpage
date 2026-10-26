import { describe, it, expect } from 'vitest';
import { renderMathInHtml } from './renderMath';

describe('renderMathInHtml', () => {
  it('converts TipTap inline-math nodes to KaTeX HTML elements', () => {
    const input = '<p>Formula: <span data-type="inline-math" data-latex="E = mc^2">$E = mc^2$</span></p>';
    const output = renderMathInHtml(input);
    expect(output).toContain('class="katex"');
    expect(output).not.toContain('<span data-type="inline-math"');
  });

  it('converts TipTap block-math nodes to display container with centered KaTeX', () => {
    const input = '<div data-type="block-math" data-latex="\\int_0^1 x dx">$$\\int_0^1 x dx$$</div>';
    const output = renderMathInHtml(input);
    expect(output).toContain('class="katex-display-container my-6 text-center"');
    expect(output).toContain('class="katex-display"');
  });

  it('decodes HTML entities in LaTeX strings before rendering', () => {
    const input = '<span data-type="inline-math" data-latex="x &lt; y">$x < y$</span>';
    const output = renderMathInHtml(input);
    expect(output).toContain('class="katex"');
  });

  it('returns empty string if given falsy input', () => {
    expect(renderMathInHtml('')).toBe('');
  });
});
