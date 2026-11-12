import { describe, it, expect } from 'vitest';
import { sanitizeArticleHtml } from './sanitizeArticleHtml';

describe('sanitizeArticleHtml', () => {
  it('strips <script> tags and malicious inline event handlers', () => {
    const dirty = '<p>Normal text</p><script>alert("xss")</script><img src="x" onerror="alert(1)" /><a href="javascript:steal()">Link</a>';
    const clean = sanitizeArticleHtml(dirty);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('<p>Normal text</p>');
  });

  it('preserves valid editorial markup including math, tables, and nav', () => {
    const valid = '<nav data-type="article-index" class="toc"><ul><li><a href="#intro">Intro</a></li></ul></nav><div class="article-content"><p>Equation: <span class="katex">x = 1</span></p><table><thead><tr><th>Col</th></tr></thead><tbody><tr><td>Val</td></tr></tbody></table></div>';
    const clean = sanitizeArticleHtml(valid);

    expect(clean).toContain('data-type="article-index"');
    expect(clean).toContain('<table>');
    expect(clean).toContain('<th>Col</th>');
    expect(clean).toContain('<td>Val</td>');
  });

  it('returns empty string for null, undefined or empty input', () => {
    expect(sanitizeArticleHtml('')).toBe('');
    // @ts-expect-error testing falsy inputs
    expect(sanitizeArticleHtml(null)).toBe('');
    // @ts-expect-error testing falsy inputs
    expect(sanitizeArticleHtml(undefined)).toBe('');
  });
});
