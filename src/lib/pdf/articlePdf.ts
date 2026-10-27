import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from 'pdf-lib';
import { parseDocument } from 'htmlparser2';
import type { ChildNode, Element } from 'domhandler';

/**
 * Server-side PDF typesetting for a published article.
 *
 * Uses the standard PDF fonts (Times / Helvetica / Courier) so no font files
 * have to be bundled. The TipTap HTML is flattened into a small block model
 * and typeset with manual line wrapping and pagination.
 */

export interface ArticlePdfInput {
  title: string;
  subtitle: string | null;
  typeLabel: string;
  authorName: string;
  authorBio?: string | null;
  authorNoteLabel?: string;
  date: string;
  tags: string[];
  coverImageUrl: string | null;
  html: string;
  siteName: string;
  siteUrl: string;
}

interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  mono?: boolean;
}

interface Run {
  text: string;
  style: InlineStyle;
}

type Block =
  | { kind: 'heading'; level: number; runs: Run[] }
  | { kind: 'paragraph'; runs: Run[] }
  | { kind: 'list'; ordered: boolean; items: Run[][] }
  | { kind: 'quote'; paragraphs: Run[][] }
  | { kind: 'code'; text: string }
  | { kind: 'image'; src: string; alt: string; caption: Run[] }
  | { kind: 'hr' }
  | { kind: 'table'; rows: string[][] };

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = { top: 64, bottom: 64, left: 62, right: 62 };
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN.left - MARGIN.right;

const BODY_SIZE = 10.5;
const BODY_LINE = 15.4;

const INK = rgb(0.08, 0.08, 0.08);
const MUTED = rgb(0.36, 0.36, 0.36);
const RULE = rgb(0.8, 0.78, 0.74);
const GOLD = rgb(0.6, 0.47, 0.22);

const UNSUPPORTED_CHARS =
  /[^\n\t\x20-\x7E\xA0-\xFF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/g;

const MATH_REPLACEMENTS: Record<string, string> = {
  '\u2212': '-',
  '\u2192': '->',
  '\u2190': '<-',
  '\u2264': '<=',
  '\u2265': '>=',
  '\u2260': '!=',
  '\u2248': '~',
  '\u2211': 'sum',
  '\u222B': 'int',
  '\u221A': 'sqrt',
  '\u221E': 'inf',
  '\u03C0': 'pi',
  '\u03B1': 'alpha',
  '\u03B2': 'beta',
  '\u03B3': 'gamma',
  '\u03B4': 'delta',
  '\u03A3': 'sum',
  '\u00D7': 'x',
};

/**
 * Replaces selected math symbols with text, strips characters outside the
 * supported PDF font character set, and converts nonbreaking spaces to spaces.
 */
function safeText(value: string): string {
  let text = value;

  for (const [symbol, replacement] of Object.entries(MATH_REPLACEMENTS)) {
    text = text.split(symbol).join(replacement);
  }

  return text.replace(UNSUPPORTED_CHARS, '').replace(/\u00A0/g, ' ');
}

function cleanInline(value: string): string {
  return value.replace(/\s+/g, ' ');
}

/**
 * Returns new runs with adjacent matching styles merged and outer whitespace
 * trimmed; empty runs are dropped without modifying the supplied runs.
 */
function mergeRuns(runs: Run[]): Run[] {
  const merged: Run[] = [];

  for (const run of runs) {
    if (!run.text) continue;

    const previous = merged[merged.length - 1];
    const sameStyle =
      previous &&
      Boolean(previous.style.bold) === Boolean(run.style.bold) &&
      Boolean(previous.style.italic) === Boolean(run.style.italic) &&
      Boolean(previous.style.mono) === Boolean(run.style.mono);

    if (sameStyle) {
      previous.text += run.text;
    } else {
      merged.push({ text: run.text, style: { ...run.style } });
    }
  }

  if (merged.length > 0) {
    merged[0].text = merged[0].text.replace(/^\s+/, '');
    const last = merged[merged.length - 1];
    last.text = last.text.replace(/\s+$/, '');
  }

  return merged.filter((run) => run.text.length > 0);
}

function textOf(node: ChildNode): string {
  if (node.type === 'text') return node.data;
  if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
    return node.children.map(textOf).join('');
  }
  return '';
}

function findTexAnnotation(node: ChildNode): string | null {
  if (node.type === 'tag') {
    if (
      node.name.toLowerCase() === 'annotation' &&
      (node.attribs.encoding || '').includes('tex')
    ) {
      return textOf(node).trim();
    }

    for (const child of node.children) {
      const found = findTexAnnotation(child);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Flattens inline HTML into styled text runs, preserving explicit line breaks.
 * KaTeX spans use TeX annotations when available; inline images are skipped.
 */
function inlineRuns(nodes: ChildNode[], style: InlineStyle = {}): Run[] {
  const runs: Run[] = [];

  for (const node of nodes) {
    if (node.type === 'text') {
      runs.push({ text: cleanInline(node.data), style });
      continue;
    }

    if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') {
      continue;
    }

    const name = node.name.toLowerCase();

    if (name === 'br') {
      runs.push({ text: '\n', style });
      continue;
    }

    if (name === 'strong' || name === 'b') {
      runs.push(...inlineRuns(node.children, { ...style, bold: true }));
      continue;
    }

    if (name === 'em' || name === 'i') {
      runs.push(...inlineRuns(node.children, { ...style, italic: true }));
      continue;
    }

    if (name === 'code' || name === 'kbd') {
      runs.push(...inlineRuns(node.children, { ...style, mono: true }));
      continue;
    }

    if (name === 'span' && (node.attribs.class || '').includes('katex')) {
      const tex = findTexAnnotation(node);
      runs.push({
        text: tex ? ` ${cleanInline(tex)} ` : cleanInline(textOf(node)),
        style: { ...style, italic: true },
      });
      continue;
    }

    if (name === 'img') {
      // Inline images are promoted to their own block when they reach the
      // block walker; inside inline flow we simply skip them.
      continue;
    }

    runs.push(...inlineRuns(node.children, style));
  }

  return runs;
}

/**
 * Appends nonempty quote paragraphs and list items to `out` in document order.
 */
function collectQuoteParagraphs(nodes: ChildNode[], out: Run[][]): void {
  for (const node of nodes) {
    if (node.type === 'text') {
      const runs = mergeRuns([{ text: cleanInline(node.data), style: { italic: true } }]);
      if (runs.length > 0) out.push(runs);
      continue;
    }

    if (node.type !== 'tag') continue;

    const name = node.name.toLowerCase();

    if (name === 'p') {
      const runs = mergeRuns(inlineRuns(node.children));
      if (runs.length > 0) out.push(runs);
      continue;
    }

    if (name === 'ul' || name === 'ol') {
      for (const child of node.children) {
        if (child.type === 'tag' && child.name.toLowerCase() === 'li') {
          const runs = mergeRuns(inlineRuns(child.children));
          if (runs.length > 0) out.push(runs);
        }
      }
      continue;
    }

    if (name === 'br') continue;

    collectQuoteParagraphs(node.children, out);
  }
}

function tableRows(table: Element): string[][] {
  const rows: string[][] = [];

  for (const child of table.children) {
    if (child.type !== 'tag') continue;

    const name = child.name.toLowerCase();

    if (name === 'thead' || name === 'tbody' || name === 'tfoot') {
      rows.push(...tableRows(child));
      continue;
    }

    if (name !== 'tr') continue;

    const cells: string[] = [];

    for (const cell of child.children) {
      if (cell.type !== 'tag') continue;
      const cellName = cell.name.toLowerCase();
      if (cellName !== 'td' && cellName !== 'th') continue;
      cells.push(cleanInline(textOf(cell)).trim());
    }

    if (cells.length > 0) rows.push(cells);
  }

  return rows;
}

function figureImage(nodes: ChildNode[]): Element | null {
  for (const node of nodes) {
    if (node.type !== 'tag') continue;
    if (node.name.toLowerCase() === 'img') return node;
    const nested = figureImage(node.children);
    if (nested) return nested;
  }
  return null;
}

function figureCaption(nodes: ChildNode[]): Run[] {
  for (const node of nodes) {
    if (node.type !== 'tag') continue;
    if (node.name.toLowerCase() === 'figcaption') {
      return mergeRuns(inlineRuns(node.children, { italic: true }));
    }
    const nested = figureCaption(node.children);
    if (nested.length > 0) return nested;
  }
  return [];
}

/**
 * Appends supported article blocks to `out` in document order, skipping navigation
 * indexes and flattening other elements to inline text. Does not sanitize HTML.
 */
function blocksFromNodes(nodes: ChildNode[], out: Block[]): void {
  for (const node of nodes) {
    if (node.type === 'text') {
      const runs = mergeRuns([{ text: cleanInline(node.data), style: {} }]);
      if (runs.length > 0) out.push({ kind: 'paragraph', runs });
      continue;
    }

    if (node.type !== 'tag') continue;

    const name = node.name.toLowerCase();

    if (name === 'h1' || name === 'h2' || name === 'h3' || name === 'h4' || name === 'h5' || name === 'h6') {
      const runs = mergeRuns(inlineRuns(node.children));
      if (runs.length > 0) {
        out.push({ kind: 'heading', level: Number(name[1]), runs });
      }
      continue;
    }

    if (name === 'p') {
      const runs = mergeRuns(inlineRuns(node.children));
      if (runs.length > 0) out.push({ kind: 'paragraph', runs });
      continue;
    }

    if (name === 'ul' || name === 'ol') {
      const items: Run[][] = [];
      for (const child of node.children) {
        if (child.type !== 'tag' || child.name.toLowerCase() !== 'li') continue;
        const runs = mergeRuns(inlineRuns(child.children));
        if (runs.length > 0) items.push(runs);
      }
      if (items.length > 0) out.push({ kind: 'list', ordered: name === 'ol', items });
      continue;
    }

    if (name === 'blockquote') {
      const paragraphs: Run[][] = [];
      collectQuoteParagraphs(node.children, paragraphs);
      if (paragraphs.length > 0) out.push({ kind: 'quote', paragraphs });
      continue;
    }

    if (name === 'figure') {
      const image = figureImage(node.children);
      if (image) {
        out.push({
          kind: 'image',
          src: image.attribs.src || '',
          alt: image.attribs.alt || '',
          caption: figureCaption(node.children),
        });
        continue;
      }
      blocksFromNodes(node.children, out);
      continue;
    }

    if (name === 'img') {
      out.push({
        kind: 'image',
        src: node.attribs.src || '',
        alt: node.attribs.alt || '',
        caption: [],
      });
      continue;
    }

    if (name === 'pre') {
      const text = textOf(node).replace(/\u00A0/g, ' ');
      if (text.trim()) out.push({ kind: 'code', text: text.replace(/^\n+|\n+$/g, '') });
      continue;
    }

    if (name === 'hr') {
      out.push({ kind: 'hr' });
      continue;
    }

    if (name === 'table') {
      const rows = tableRows(node);
      if (rows.length > 0) out.push({ kind: 'table', rows });
      continue;
    }

    if (name === 'nav') {
      // The in-article index duplicates the document structure.
      continue;
    }

    if (name === 'div' || name === 'section' || name === 'article' || name === 'main' || name === 'body') {
      blocksFromNodes(node.children, out);
      continue;
    }

    const runs = mergeRuns(inlineRuns([node]));
    if (runs.length > 0) out.push({ kind: 'paragraph', runs });
  }
}

/**
 * Parses article HTML with entity decoding into supported PDF blocks, omitting
 * navigation indexes. This conversion does not sanitize the source HTML.
 */
function htmlToBlocks(html: string): Block[] {
  const document = parseDocument(html, { decodeEntities: true });
  const blocks: Block[] = [];
  blocksFromNodes(document.children, blocks);
  return blocks;
}

/**
 * Accepts parseable HTTP(S) URLs except localhost, 0.0.0.0, and the listed private,
 * loopback, and link-local IPv4 prefixes. Does not resolve DNS or check redirects.
 */
function isFetchableUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname;
    return !(
      host === 'localhost' ||
      host === '0.0.0.0' ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  } catch {
    return false;
  }
}

interface LineSegment {
  text: string;
  font: PDFFont;
  size: number;
}

type Line = LineSegment[];

interface WordToken {
  text: string;
  font: PDFFont;
  size: number;
  width: number;
  spaceBefore: boolean;
  breakBefore: boolean;
}

class ArticlePdfBuilder {
  private readonly document: PDFDocument;
  private page!: PDFPage;
  private pages: PDFPage[] = [];
  private y = 0;

  private fontSans!: PDFFont;
  private fontSansBold!: PDFFont;
  private fontSerif!: PDFFont;
  private fontSerifBold!: PDFFont;
  private fontSerifItalic!: PDFFont;
  private fontSerifBoldItalic!: PDFFont;
  private fontMono!: PDFFont;

  private readonly imageCache = new Map<string, PDFImage | null>();

  private constructor(document: PDFDocument) {
    this.document = document;
  }

  static async create(): Promise<ArticlePdfBuilder> {
    const document = await PDFDocument.create();
    const builder = new ArticlePdfBuilder(document);

    builder.fontSans = await document.embedFont(StandardFonts.Helvetica);
    builder.fontSansBold = await document.embedFont(StandardFonts.HelveticaBold);
    builder.fontSerif = await document.embedFont(StandardFonts.TimesRoman);
    builder.fontSerifBold = await document.embedFont(StandardFonts.TimesRomanBold);
    builder.fontSerifItalic = await document.embedFont(StandardFonts.TimesRomanItalic);
    builder.fontSerifBoldItalic = await document.embedFont(StandardFonts.TimesRomanBoldItalic);
    builder.fontMono = await document.embedFont(StandardFonts.Courier);

    document.setTitle('');
    document.setProducer('Cerna Pensamento');
    builder.newPage();

    return builder;
  }

  private fontFor(style: InlineStyle, size: number): PDFFont {
    if (style.mono) return this.fontMono;
    if (style.bold && style.italic) return this.fontSerifBoldItalic;
    if (style.bold) return size <= 9 ? this.fontSansBold : this.fontSerifBold;
    if (style.italic) return this.fontSerifItalic;
    return size <= 9 ? this.fontSans : this.fontSerif;
  }

  private newPage(): void {
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pages.push(this.page);
    this.y = PAGE_HEIGHT - MARGIN.top;
  }

  private ensureSpace(height: number): void {
    if (this.y - height < MARGIN.bottom + 18) {
      this.newPage();
    }
  }

  private rule(spaceBefore = 0, spaceAfter = 0): void {
    this.ensureSpace(spaceBefore + spaceAfter + 1);
    this.y -= spaceBefore;
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN.right, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= spaceAfter;
  }

  private layoutRuns(runs: Run[], size: number, maxWidth: number): Line[] {
    const tokens: WordToken[] = [];

    for (const run of runs) {
      if (!run.text) continue;

      const font = this.fontFor(run.style, size);
      const normalized = safeText(run.text).replace(/\t/g, ' ');
      const lines = normalized.split('\n');

      lines.forEach((lineText, lineIndex) => {
        const words = lineText.split(/ +/);

        words.forEach((word, wordIndex) => {
          if (!word) return;

          tokens.push({
            text: word,
            font,
            size,
            width: font.widthOfTextAtSize(word, size),
            spaceBefore: wordIndex > 0,
            breakBefore: false,
          });
        });

        if (lineIndex < lines.length - 1) {
          tokens.push({
            text: '',
            font,
            size,
            width: 0,
            spaceBefore: false,
            breakBefore: true,
          });
        }
      });
    }

    const result: Line[] = [];
    let line: Line = [];
    let width = 0;

    const flush = () => {
      if (line.length > 0) result.push(line);
      line = [];
      width = 0;
    };

    for (const token of tokens) {
      if (token.breakBefore) {
        flush();
        continue;
      }

      const spaceWidth =
        token.spaceBefore && line.length > 0
          ? token.font.widthOfTextAtSize(' ', token.size)
          : 0;

      if (line.length > 0 && width + spaceWidth + token.width > maxWidth) {
        flush();
      }

      if (line.length > 0 && token.spaceBefore) {
        line.push({ text: ' ', font: token.font, size: token.size });
        width += token.font.widthOfTextAtSize(' ', token.size);
      }

      line.push({ text: token.text, font: token.font, size: token.size });
      width += token.width;
    }

    flush();

    return result;
  }

  private drawLines(
    lines: Line[],
    options: { x?: number; lineHeight?: number; color?: ReturnType<typeof rgb> } = {}
  ): void {
    const x = options.x ?? MARGIN.left;
    const lineHeight = options.lineHeight ?? BODY_LINE;
    const color = options.color ?? INK;

    for (const line of lines) {
      this.ensureSpace(lineHeight);
      let cursor = x;

      for (const segment of line) {
        if (segment.text) {
          this.page.drawText(segment.text, {
            x: cursor,
            y: this.y,
            font: segment.font,
            size: segment.size,
            color,
          });
        }
        cursor += segment.font.widthOfTextAtSize(segment.text, segment.size);
      }

      this.y -= lineHeight;
    }
  }

  private async loadImage(rawUrl: string): Promise<PDFImage | null> {
    if (!rawUrl) return null;

    const url = rawUrl.startsWith('//')
      ? `https:${rawUrl}`
      : rawUrl.startsWith('/')
        ? `${this.siteUrl}${rawUrl}`
        : rawUrl;

    if (!isFetchableUrl(url)) return null;
    if (this.imageCache.has(url)) return this.imageCache.get(url) ?? null;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!response.ok) {
        this.imageCache.set(url, null);
        return null;
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e;
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
      const isWebp =
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50;

      let image: PDFImage;

      if (isPng) {
        image = await this.document.embedPng(bytes);
      } else if (isJpeg) {
        image = await this.document.embedJpg(bytes);
      } else if (isWebp) {
        // Uploads are stored as WebP inside .jpg files, which pdf-lib cannot
        // embed directly; normalise them to a print-sized JPEG first.
        const { default: sharp } = await import('sharp');
        const jpeg = await sharp(bytes)
          .resize({ width: 1400, withoutEnlargement: true })
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: 82 })
          .toBuffer();
        image = await this.document.embedJpg(new Uint8Array(jpeg));
      } else {
        this.imageCache.set(url, null);
        return null;
      }

      this.imageCache.set(url, image);
      return image;
    } catch {
      this.imageCache.set(url, null);
      return null;
    }
  }

  private siteUrl = '';

  setSiteUrl(url: string): void {
    this.siteUrl = url.replace(/\/$/, '');
  }

  private async drawImage(
    src: string,
    options: { caption?: Run[]; maxHeight?: number }
  ): Promise<void> {
    const image = await this.loadImage(src);
    if (!image) return;

    const maxWidth = CONTENT_WIDTH;
    const maxHeight = options.maxHeight ?? 420;
    const ratio = image.height / image.width;

    let width = maxWidth;
    let height = width * ratio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height / ratio;
    }

    this.ensureSpace(height + 10);

    this.page.drawImage(image, {
      x: MARGIN.left + (CONTENT_WIDTH - width) / 2,
      y: this.y - height,
      width,
      height,
    });

    this.y -= height + 8;

    if (options.caption && options.caption.length > 0) {
      const lines = this.layoutRuns(options.caption, 8.5, CONTENT_WIDTH);
      this.drawLines(lines, { lineHeight: 11.5, color: MUTED });
    }

    this.y -= 10;
  }

  private async drawTable(rows: string[][]): Promise<void> {
    const columns = Math.max(...rows.map((row) => row.length));
    if (columns === 0) return;

    const cellPadding = 4;
    const columnWidth = CONTENT_WIDTH / columns;
    const fontSize = 8.5;
    const lineHeight = 11;

    for (const row of rows) {
      const cellLines = Array.from({ length: columns }, (_, index) => {
        const value = row[index] ?? '';
        const runs = mergeRuns([{ text: value, style: {} }]);
        return this.layoutRuns(runs, fontSize, columnWidth - cellPadding * 2);
      });

      const rowHeight =
        Math.max(...cellLines.map((lines) => lines.length), 1) * lineHeight + cellPadding * 2;

      this.ensureSpace(rowHeight);

      const top = this.y;

      cellLines.forEach((lines, columnIndex) => {
        const x = MARGIN.left + columnIndex * columnWidth;
        let cursor = top - cellPadding - lineHeight + 2;

        for (const line of lines) {
          let textX = x + cellPadding;
          for (const segment of line) {
            this.page.drawText(segment.text, {
              x: textX,
              y: cursor,
              font: this.fontSans,
              size: fontSize,
              color: INK,
            });
            textX += this.fontSans.widthOfTextAtSize(segment.text, fontSize);
          }
          cursor -= lineHeight;
        }
      });

      this.y = top - rowHeight;

      this.page.drawLine({
        start: { x: MARGIN.left, y: this.y },
        end: { x: PAGE_WIDTH - MARGIN.right, y: this.y },
        thickness: 0.5,
        color: RULE,
      });
    }

    this.y -= 12;
  }

  private drawCode(text: string): void {
    const fontSize = 8;
    const lineHeight = 10.5;
    const indent = 8;

    const lines: string[] = [];

    for (const rawLine of safeText(text).split('\n')) {
      const normalized = rawLine.replace(/\t/g, '    ');
      if (!normalized) {
        lines.push('');
        continue;
      }

      let current = '';
      for (const char of normalized) {
        const candidate = current + char;
        if (this.fontMono.widthOfTextAtSize(candidate, fontSize) > CONTENT_WIDTH - indent * 2) {
          lines.push(current);
          current = char;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);
    }

    this.y -= 4;

    for (const line of lines) {
      this.ensureSpace(lineHeight);

      if (line) {
        this.page.drawText(line, {
          x: MARGIN.left + indent,
          y: this.y,
          font: this.fontMono,
          size: fontSize,
          color: INK,
        });
      }

      this.y -= lineHeight;
    }

    this.y -= 12;
  }

  async drawMasthead(input: ArticlePdfInput): Promise<void> {
    const eyebrow = safeText(input.typeLabel).toUpperCase();

    this.page.drawText(eyebrow, {
      x: MARGIN.left,
      y: this.y - 8,
      font: this.fontSansBold,
      size: 7.5,
      color: GOLD,
    });

    this.y -= 26;

    const titleLines = this.layoutRuns(
      [{ text: input.title, style: { bold: true } }],
      24,
      CONTENT_WIDTH
    );
    this.drawLines(titleLines, { lineHeight: 28 });

    this.y -= 6;

    if (input.subtitle) {
      const subtitleLines = this.layoutRuns(
        [{ text: input.subtitle, style: { italic: true } }],
        12.5,
        CONTENT_WIDTH
      );
      this.drawLines(subtitleLines, { lineHeight: 17, color: MUTED });
      this.y -= 6;
    }

    this.rule(4, 12);

    const byline = safeText(`${input.authorName} · ${input.date}`).toUpperCase();
    this.page.drawText(byline, {
      x: MARGIN.left,
      y: this.y,
      font: this.fontSans,
      size: 8,
      color: MUTED,
    });
    this.y -= 22;

    if (input.coverImageUrl) {
      await this.drawImage(input.coverImageUrl, { maxHeight: 300 });
    }

    if (input.tags.length > 0) {
      const tagLine = input.tags
        .map((tag) => `#${safeText(tag).toUpperCase()}`)
        .join('  ·  ');
      const tagLines = this.layoutRuns([{ text: tagLine, style: {} }], 7.5, CONTENT_WIDTH);
      this.drawLines(tagLines, { lineHeight: 10.5, color: GOLD });
      this.y -= 10;
    }

    this.rule(0, 16);
  }

  async drawAuthorNote(input: ArticlePdfInput): Promise<void> {
    if (!input.authorBio) return;

    this.rule(20, 14);

    this.page.drawText(safeText(input.authorNoteLabel || 'Sobre o autor').toUpperCase(), {
      x: MARGIN.left,
      y: this.y - 7,
      font: this.fontSansBold,
      size: 7,
      color: GOLD,
    });

    this.y -= 20;

    const nameLines = this.layoutRuns(
      [{ text: input.authorName, style: { bold: true } }],
      11,
      CONTENT_WIDTH
    );
    this.drawLines(nameLines, { lineHeight: 14 });

    this.y -= 2;

    const bioLines = this.layoutRuns([{ text: input.authorBio, style: {} }], 9.5, CONTENT_WIDTH);
    this.drawLines(bioLines, { lineHeight: 13, color: MUTED });
  }

  async drawBlocks(blocks: Block[]): Promise<void> {
    for (const block of blocks) {
      switch (block.kind) {
        case 'heading': {
          const sizes: Record<number, number> = { 1: 17, 2: 14, 3: 12, 4: 11, 5: 10.5, 6: 10.5 };
          const size = sizes[block.level] ?? 12;
          this.ensureSpace(size + 26);
          this.y -= 12;

          const lines = this.layoutRuns(
            block.runs.map((run) => ({ ...run, style: { ...run.style, bold: true } })),
            size,
            CONTENT_WIDTH
          );
          this.drawLines(lines, { lineHeight: size * 1.35 });
          this.y -= 6;
          break;
        }

        case 'paragraph': {
          const lines = this.layoutRuns(block.runs, BODY_SIZE, CONTENT_WIDTH);
          if (lines.length === 0) break;
          this.ensureSpace(BODY_LINE * 2);
          this.drawLines(lines);
          this.y -= 7;
          break;
        }

        case 'list': {
          block.items.forEach((item, index) => {
            const marker = block.ordered ? `${index + 1}.` : '•';
            const indent = 16;
            const lines = this.layoutRuns(item, BODY_SIZE, CONTENT_WIDTH - indent);
            if (lines.length === 0) return;

            this.ensureSpace(BODY_LINE);
            this.page.drawText(marker, {
              x: MARGIN.left + 2,
              y: this.y,
              font: this.fontSerif,
              size: BODY_SIZE,
              color: INK,
            });
            this.drawLines(lines, { x: MARGIN.left + indent });
            this.y -= 4;
          });
          this.y -= 4;
          break;
        }

        case 'quote': {
          const total = block.paragraphs.length;
          this.y -= 6;

          block.paragraphs.forEach((paragraph, index) => {
            const lines = this.layoutRuns(paragraph, BODY_SIZE, CONTENT_WIDTH - 18);
            const height = lines.length * BODY_LINE;

            this.ensureSpace(height + 4);
            const startPage = this.page;
            const top = this.y;
            this.drawLines(lines, { x: MARGIN.left + 18, color: MUTED });

            if (this.page === startPage) {
              this.page.drawLine({
                start: { x: MARGIN.left + 4, y: top + BODY_SIZE },
                end: { x: MARGIN.left + 4, y: this.y + 4 },
                thickness: 1.2,
                color: GOLD,
              });
            }

            if (index < total - 1) this.y -= 6;
          });

          this.y -= 10;
          break;
        }

        case 'image': {
          await this.drawImage(block.src, {
            caption: block.caption,
            maxHeight: 420,
          });
          break;
        }

        case 'code': {
          this.drawCode(block.text);
          break;
        }

        case 'hr': {
          this.rule(10, 14);
          break;
        }

        case 'table': {
          await this.drawTable(block.rows);
          break;
        }
      }
    }
  }

  finish(input: ArticlePdfInput): Promise<Uint8Array> {
    const total = this.pages.length;

    this.pages.forEach((page, index) => {
      page.drawLine({
        start: { x: MARGIN.left, y: 44 },
        end: { x: PAGE_WIDTH - MARGIN.right, y: 44 },
        thickness: 0.5,
        color: RULE,
      });

      page.drawText(safeText(input.siteName), {
        x: MARGIN.left,
        y: 31,
        font: this.fontSans,
        size: 7.5,
        color: MUTED,
      });

      page.drawText(safeText(input.siteUrl.replace(/^https?:\/\//, '')), {
        x: MARGIN.left + 90,
        y: 31,
        font: this.fontSans,
        size: 7.5,
        color: MUTED,
      });

      const label = `${index + 1} / ${total}`;
      page.drawText(label, {
        x: PAGE_WIDTH - MARGIN.right - this.fontSans.widthOfTextAtSize(label, 7.5),
        y: 31,
        font: this.fontSans,
        size: 7.5,
        color: MUTED,
      });
    });

    this.document.setTitle(safeText(input.title));
    this.document.setAuthor(safeText(input.authorName));
    this.document.setSubject(safeText(input.subtitle ?? ''));
    this.document.setCreator(input.siteName);

    return this.document.save();
  }
}

/**
 * Typesets article HTML and prelocalized metadata into paginated A4 PDF bytes.
 * Fetches supported cover/inline images, resolving root-relative URLs against
 * `siteUrl`; failed, unsupported, or rejected image loads are omitted. Text outside
 * the supported font character set is replaced or removed. PDF creation, parsing,
 * typesetting, and serialization errors propagate to the caller.
 */
export async function buildArticlePdf(input: ArticlePdfInput): Promise<Uint8Array> {
  const builder = await ArticlePdfBuilder.create();
  builder.setSiteUrl(input.siteUrl);

  await builder.drawMasthead(input);

  const blocks = htmlToBlocks(input.html);
  await builder.drawBlocks(blocks);
  await builder.drawAuthorNote(input);

  return builder.finish(input);
}
