// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { ArticleIndex, type IndexItem, type Slug } from './ArticleIndexExtension';
import {
  generateIndex,
  getHeadingsFromHtml,
  stripIndex,
  getIndexLabels,
} from './generateIndex';

function createTestEditor(content = '') {
  return new Editor({
    extensions: [StarterKit, ArticleIndex],
    content,
  });
}

describe('ArticleIndexExtension & generateIndex', () => {
  const sampleItems: IndexItem[] = [
    { path: [1], text: 'Introdución', slug: 'introducion' as Slug },
    { path: [1, 1], text: 'Contexto histórico', slug: 'contexto-historico' as Slug },
    { path: [1, 1, 1], text: 'Detalle', slug: 'detalle' as Slug },
  ];

  describe('ArticleIndex TipTap node', () => {
    it('inserts an index at position 0 and replaces an existing index in-place', () => {
      const editor = createTestEditor('<p>Texto do artigo</p>');

      editor.commands.insertArticleIndex({ items: sampleItems, lang: 'gl' });
      let html = editor.getHTML();

      expect(html).toContain('data-type="article-index"');
      expect(html).toContain('aria-label="Índice do artigo"');
      expect(html).toContain('1.');
      expect(html).toContain('1.1.');
      expect(html).toContain('1.1.1.');
      expect(html).toContain('href="#introducion"');

      // Replacing with updated items & Spanish locale should not duplicate the block
      const updatedItems: IndexItem[] = [
        { path: [1], text: 'Conclusión', slug: 'conclusion' as Slug },
      ];
      editor.commands.insertArticleIndex({ items: updatedItems, lang: 'es' });
      html = editor.getHTML();

      expect(html.match(/data-type="article-index"/g)).toHaveLength(1);
      expect(html).toContain('aria-label="Índice del artículo"');
      expect(html).toContain('Conclusión');
      expect(html).not.toContain('Introdución');

      editor.destroy();
    });

    it('parses modern data-items and lang from existing HTML', () => {
      const generated = generateIndex('<h1>Primera</h1><h2>Segunda</h2>', 'es');
      const editor = createTestEditor(`${generated}<p>Contenido</p>`);

      const indexNode = editor.state.doc.firstChild;
      expect(indexNode?.type.name).toBe('articleIndex');
      expect(indexNode?.attrs.lang).toBe('es');
      expect(indexNode?.attrs.items).toEqual([
        { path: [1], text: 'Primera', slug: 'primera' },
        { path: [1, 1], text: 'Segunda', slug: 'segunda' },
      ]);

      editor.destroy();
    });

    it('migrates legacy num-based data-items when parsing HTML', () => {
      const legacyItems = JSON.stringify([
        { num: '1', text: 'Sección', slug: 'seccion' },
        { num: '1.2', text: 'Subsección', slug: 'subseccion' },
      ]);
      const editor = createTestEditor(
        `<nav data-type="article-index" lang="pt" data-items='${legacyItems}'></nav><p>Texto</p>`
      );

      const indexNode = editor.state.doc.firstChild;
      expect(indexNode?.type.name).toBe('articleIndex');
      expect(indexNode?.attrs.lang).toBe('pt');
      expect(indexNode?.attrs.items).toEqual([
        { path: [1], text: 'Sección', slug: 'seccion' },
        { path: [1, 2], text: 'Subsección', slug: 'subseccion' },
      ]);

      editor.destroy();
    });
  });

  describe('generateIndex helpers', () => {
    it('promotes H2/H3 when document has no H1', () => {
      const items = getHeadingsFromHtml('<h2>Cap 1</h2><h3>Sec 1.1</h3><h2>Cap 2</h2>');
      expect(items).toEqual([
        { path: [1], text: 'Cap 1', slug: 'cap-1' },
        { path: [1, 1], text: 'Sec 1.1', slug: 'sec-11' },
        { path: [2], text: 'Cap 2', slug: 'cap-2' },
      ]);
    });

    it('resolves localized aria-labels across supported locales with fallback', () => {
      expect(getIndexLabels('gl')).toEqual({ label: 'Índice', ariaLabel: 'Índice do artigo' });
      expect(getIndexLabels('es')).toEqual({ label: 'Índice', ariaLabel: 'Índice del artículo' });
      expect(getIndexLabels('pt')).toEqual({ label: 'Índice', ariaLabel: 'Índice do artigo' });
      expect(getIndexLabels('en')).toEqual({ label: 'Índice', ariaLabel: 'Article index' });
      expect(getIndexLabels('fr')).toEqual({ label: 'Índice', ariaLabel: 'Índice' });
    });

    it('strips generated index blocks cleanly', () => {
      const content = '<h1>Título</h1><p>Corpo</p>';
      const indexHtml = generateIndex(content, 'gl');
      expect(stripIndex(`${indexHtml}\n${content}`)).toBe(content);
    });
  });
});
