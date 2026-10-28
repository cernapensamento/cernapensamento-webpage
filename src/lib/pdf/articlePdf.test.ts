import { describe, it, expect, vi } from 'vitest';
import { buildArticlePdf, formatMathText } from './articlePdf';
import { PDFDocument, PDFPage, PDFRawStream, PDFName } from 'pdf-lib';
import sharp from 'sharp';

describe('formatMathText', () => {
  it('formats delimiters and comparisons', () => {
    expect(formatMathText('\\vert{}E_d\\vert{} &lt; 1')).toBe('|E_d| < 1');
    expect(formatMathText('IMg &lt; P')).toBe('IMg < P');
    expect(formatMathText('P &gt; CMg')).toBe('P > CMg');
    expect(formatMathText('P = IMg = CMg')).toBe('P = IMg = CMg');
    expect(formatMathText('P_m>P_c')).toBe('P_m > P_c');
    expect(formatMathText('P_{máx} &lt; P_e')).toBe('P_(máx) < P_e');
  });

  it('formats fractions and nested fractions with Greek letters and operators', () => {
    const formula1 =
      'E_d = \\frac{\\% \\Delta Q}{\\% \\Delta P} = \\frac{\\frac{dQ}{Q}}{\\frac{dP}{P}} = \\frac{dQ}{dP} \\cdot \\frac{P}{Q}';
    const formatted1 = formatMathText(formula1);
    expect(formatted1).toContain('(% delta Q) / (% delta P)');
    expect(formatted1).toContain('(dQ / Q) / (dP / P)');
    expect(formatted1).toContain('dQ / dP · P / Q');

    const formula2 =
      'IMg = \\frac{\\Delta IT}{\\Delta Q} = \\frac{IT_n - IT_{n-1}}{Q_n - Q_{n-1}}';
    const formatted2 = formatMathText(formula2);
    expect(formatted2).toContain('(delta IT) / (delta Q)');
    expect(formatted2).toContain('(IT_n - IT_(n-1)) / (Q_n - Q_(n-1))');
  });

  it('formats symbols, roots, and common algebra functions', () => {
    expect(formatMathText('\\sqrt{x^2 + y^2}')).toBe('sqrt(x^2 + y^2)');
    expect(formatMathText('\\sqrt{x^{2} + y^{2}}')).toBe('sqrt(x^(2) + y^(2))');
    expect(formatMathText('\\sqrt{\\frac{a}{b}}')).toBe('sqrt(a / b)');
    expect(formatMathText('\\sqrt[3]{8}')).toBe('root_3(8)');
    expect(formatMathText('a \\pm b \\times c \\approx d')).toBe('a ± b × c ~ d');
    expect(formatMathText('x \\le y \\ge z \\ne w')).toBe('x <= y >= z != w');
  });
});

describe('buildArticlePdf Typesetting', () => {
  it('preserves spaces around bold and italic tags without merging words', async () => {
    const drawTextSpy = vi.spyOn(PDFPage.prototype, 'drawText');

    const html = `
      <p>Siendo Ed la <strong>elasticidad del precio de la demanda</strong>, que se calcula como...</p>
      <p>En 1962, el economista austriaco Murray Rothbard publica <em>Man, Economy and State </em>(1962/2009)<em> </em>una obra de más de 1500 páginas, que pretendió actualizar la monumental <em>La</em> <em>Acción humana </em>de Mises.</p>
    `;

    try {
      const pdfBytes = await buildArticlePdf({
        title: 'Artigo de proba',
        subtitle: 'Subtítulo',
        typeLabel: 'Ensaio',
        authorName: 'Autor Proba',
        date: '28 de outubro de 2026',
        tags: ['Filosofía'],
        coverImageUrl: null,
        html,
        siteName: 'Cerna Pensamento',
        siteUrl: 'https://cernapensamento.org',
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      const doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);

      const drawnStrings = drawTextSpy.mock.calls.map((c) => c[0]);
      // Verify adjacent words across bold and italic transitions were not merged
      expect(drawnStrings.some((s) => s.includes('laelasticidad'))).toBe(false);
      expect(drawnStrings.some((s) => s.includes('humanade'))).toBe(false);
      expect(drawnStrings.some((s) => s.includes('publicaMan'))).toBe(false);

      // Verify words are rendered with space tokens between them
      const laIdx = drawnStrings.indexOf('la');
      const elastIdx = drawnStrings.indexOf('elasticidad');
      expect(laIdx).toBeGreaterThan(-1);
      expect(elastIdx).toBe(laIdx + 2);
      expect(drawnStrings[laIdx + 1]).toBe(' ');

      const humanaIdx = drawnStrings.indexOf('humana');
      const deIdx = drawnStrings.indexOf('de', humanaIdx);
      expect(humanaIdx).toBeGreaterThan(-1);
      expect(deIdx).toBe(humanaIdx + 2);
      expect(drawnStrings[humanaIdx + 1]).toBe(' ');
    } finally {
      drawTextSpy.mockRestore();
    }
  });

  it('renders block-math and inline-math nodes without dropping formulas', async () => {
    const drawTextSpy = vi.spyOn(PDFPage.prototype, 'drawText');

    const html = `
      <p>Condición de equilibrio:</p>
      <div data-latex="\\vert{}E_d\\vert{} &lt; 1" data-type="block-math"></div>
      <p>Fórmula inline: <span data-type="inline-math" data-latex="E = mc^2">$E = mc^2$</span> no texto.</p>
      <div data-latex="E_d = \\frac{\\% \\Delta Q}{\\% \\Delta P}" data-type="block-math"></div>
    `;

    try {
      const pdfBytes = await buildArticlePdf({
        title: 'Artigo de fórmulas',
        subtitle: null,
        typeLabel: 'Ensaio',
        authorName: 'Autor Proba',
        date: '28 de outubro de 2026',
        tags: [],
        coverImageUrl: null,
        html,
        siteName: 'Cerna Pensamento',
        siteUrl: 'https://cernapensamento.org',
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      const doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);

      const drawnStrings = drawTextSpy.mock.calls.map((c) => c[0]);
      // Verify math nodes were rendered into formatted tokens on the PDF
      expect(drawnStrings).toContain('|E_d|');
      expect(drawnStrings).toContain('mc^2');
      expect(drawnStrings).toContain('delta');
      expect(drawnStrings).toContain('E_d');
    } finally {
      drawTextSpy.mockRestore();
    }
  });

  it('successfully embeds WebP cover images by converting them for pdf-lib', async () => {
    const webpBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .webp()
      .toBuffer();

    const originalFetch = global.fetch;
    const fetchSpy = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('cover.webp')) {
        return new Response(webpBuffer, {
          status: 200,
          headers: { 'content-type': 'image/webp' },
        });
      }
      return new Response(null, { status: 404 });
    });
    global.fetch = fetchSpy;

    try {
      const pdfBytes = await buildArticlePdf({
        title: 'Artigo con portada WebP',
        subtitle: null,
        typeLabel: 'Ensaio',
        authorName: 'Autor Proba',
        date: '28 de outubro de 2026',
        tags: [],
        coverImageUrl: 'https://example.com/cover.webp',
        html: '<p>Contido do artigo con imaxe.</p>',
        siteName: 'Cerna Pensamento',
        siteUrl: 'https://cernapensamento.org',
      });

      expect(fetchSpy).toHaveBeenCalledWith('https://example.com/cover.webp', expect.anything());
      expect(pdfBytes).toBeInstanceOf(Uint8Array);

      const doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);

      // Verify the image was converted and embedded as an Image XObject stream in the PDF
      const imageObjects = doc.context.enumerateIndirectObjects().filter(([, obj]) => {
        return obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Image');
      });
      expect(imageObjects.length).toBe(1);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
