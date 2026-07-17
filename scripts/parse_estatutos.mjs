import fs from 'fs';

const text = fs.readFileSync('src/app/estatutos/estatutos.txt', 'utf8');
const rawLines = text.split('\n').map(l => l.trim());

// ─── helpers ─────────────────────────────────────────────────────────────────

const isPageNumber = l => /^\d+$/.test(l);
const isChapter   = l => /^CAPÍTULO\s+[IVXLC]+$/.test(l);
const isArticle   = l => /^Artigo\s+\d+[\.\s]/.test(l);
const isListItem  = l => /^[a-z]\)/.test(l) || /^\d+\.\s/.test(l);
const isSpecial   = l =>
  isChapter(l) || isArticle(l) || isPageNumber(l) ||
  l === 'ESTATUTOS DA ASOCIACIÓN CERNA' ||
  l === 'PENSAMENTO' ||
  l === 'DISPOSICIÓN ADICIONAL' ||
  l.startsWith('En Cambados') ||
  l === 'Sinatura de todas as persoas promotoras da asociación';

// ─── First pass: collapse word-wrapped lines into logical blocks ──────────────
// A new logical block starts when:
//   - line is special (chapter, article, etc.)
//   - line starts a list item (a), b), 1., …)
//   - previous line ends a sentence (.  :  ;  ) followed by capital or list)
// Otherwise the line continues the current block.

const blocks = []; // { type: 'chapter'|'article'|'list'|'text'|'special', content: string, extra?: string }

let i = 0;
while (i < rawLines.length) {
  const l = rawLines[i];

  if (!l || isPageNumber(l)) { i++; continue; }

  if (l === 'ESTATUTOS DA ASOCIACIÓN CERNA') {
    // skip next line "PENSAMENTO"
    blocks.push({ type: 'title' });
    i += 2;
    continue;
  }

  if (isChapter(l)) {
    // next non-empty line is the chapter title
    let j = i + 1;
    while (j < rawLines.length && (!rawLines[j] || isPageNumber(rawLines[j]))) j++;
    blocks.push({ type: 'chapter', content: l, extra: rawLines[j] || '' });
    i = j + 1;
    continue;
  }

  if (isArticle(l)) {
    // Article heading – collect continuation words on same logical line
    let heading = l;
    let j = i + 1;
    // Article headings sometimes wrap – but they're usually 1 line; leave as-is
    blocks.push({ type: 'article', content: heading });
    i = j;
    continue;
  }

  if (l === 'DISPOSICIÓN ADICIONAL' || l.startsWith('En Cambados')) {
    blocks.push({ type: 'disposition', content: l });
    i++;
    continue;
  }

  if (l === 'Sinatura de todas as persoas promotoras da asociación') {
    blocks.push({ type: 'signature', content: l });
    i++;
    continue;
  }

  // List item – accumulate continuation lines that don't start a new item
  if (isListItem(l)) {
    let accumulated = l;
    let j = i + 1;
    while (j < rawLines.length) {
      const next = rawLines[j].trim();
      if (!next || isPageNumber(next) || isSpecial(next) || isListItem(next)) break;
      accumulated += ' ' + next;
      j++;
    }
    blocks.push({ type: 'list', content: accumulated });
    i = j;
    continue;
  }

  // Regular paragraph – accumulate until a sentence boundary or structural break
  let accumulated = l;
  let j = i + 1;
  while (j < rawLines.length) {
    const next = rawLines[j].trim();
    if (!next || isPageNumber(next) || isSpecial(next) || isListItem(next)) break;
    // If previous chunk ends with sentence-final punctuation and next starts uppercase → new para
    const prev = accumulated.trim();
    if ((prev.endsWith('.') || prev.endsWith(':') || prev.endsWith(';')) &&
        next.length > 0 && next[0] === next[0].toUpperCase() && !/^[a-z]/.test(next)) {
      break;
    }
    accumulated += ' ' + next;
    j++;
  }
  blocks.push({ type: 'text', content: accumulated });
  i = j;
}

// ─── Second pass: generate TSX ───────────────────────────────────────────────

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

let out = `import React from 'react';\n\nexport default function EstatutosContent() {\n  return (\n    <article className="text-charcoal/85 font-serif text-[1.0625rem] leading-[1.95] max-w-full">\n`;

let sectionOpen = false;
let articleOpen = false;

for (const block of blocks) {
  switch (block.type) {
    case 'title':
      out += `      <h1 className="sr-only">ESTATUTOS DA ASOCIACIÓN CERNA PENSAMENTO</h1>\n`;
      break;

    case 'chapter': {
      if (articleOpen) { out += `      </section>\n`; articleOpen = false; }
      if (sectionOpen) { out += `    </section>\n`; sectionOpen = false; }
      const id = block.content.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      out += `    <section aria-labelledby="${id}">\n`;
      out += `      <h2 id="${id}" className="mt-20 mb-14 pb-6 border-b-2 border-lines text-center">\n`;
      out += `        <span className="block font-sans text-xs font-semibold text-gold tracking-[0.35em] uppercase mb-3">${esc(block.content)}</span>\n`;
      out += `        <span className="block font-serif text-3xl md:text-4xl text-charcoal font-normal">${esc(block.extra)}</span>\n`;
      out += `      </h2>\n`;
      sectionOpen = true;
      break;
    }

    case 'article': {
      if (articleOpen) { out += `      </section>\n`; articleOpen = false; }
      const id = block.content.split('.')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      out += `      <section aria-labelledby="${id}" className="mt-14 scroll-mt-8">\n`;
      out += `        <h3 id="${id}" className="font-serif text-xl md:text-[1.375rem] text-charcoal font-semibold mb-6 pb-3 border-b border-lines/60">${esc(block.content)}</h3>\n`;
      articleOpen = true;
      break;
    }

    case 'list': {
      const indent = articleOpen ? '        ' : '      ';
      out += `${indent}<p className="mb-4 pl-6 ml-2 border-l-2 border-gold/35 text-charcoal/80">${esc(block.content)}</p>\n`;
      break;
    }

    case 'text': {
      const indent = articleOpen ? '        ' : '      ';
      out += `${indent}<p className="mb-7 text-justify hyphens-auto">${esc(block.content)}</p>\n`;
      break;
    }

    case 'disposition': {
      if (articleOpen) { out += `      </section>\n`; articleOpen = false; }
      if (sectionOpen) { out += `    </section>\n`; sectionOpen = false; }
      out += `    <section aria-labelledby="disposicion" className="mt-20">\n`;
      out += `      <h2 id="disposicion" className="mt-16 mb-10 pb-6 border-b-2 border-lines font-serif text-2xl md:text-3xl text-charcoal text-center font-normal">${esc(block.content)}</h2>\n`;
      sectionOpen = true;
      break;
    }

    case 'signature': {
      out += `      <p className="mt-16 pt-8 border-t border-lines/50 italic text-charcoal/50 text-right text-base">${esc(block.content)}</p>\n`;
      break;
    }
  }
}

if (articleOpen) out += `      </section>\n`;
if (sectionOpen) out += `    </section>\n`;

out += `    </article>\n  );\n}\n`;

fs.writeFileSync('src/app/estatutos/EstatutosContent.tsx', out);
console.log('Done! Blocks:', blocks.length);
