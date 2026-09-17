import { Node, mergeAttributes } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';

export type Slug = string & { readonly __brand: unique symbol };

export interface IndexItem {
  readonly path: readonly number[];
  readonly text: string;
  readonly slug: Slug;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    articleIndex: {
      insertArticleIndex: (options: { items: IndexItem[]; lang: 'gl' | 'es' }) => ReturnType;
    };
  }
}

export const ArticleIndex = Node.create({
  name: 'articleIndex',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      items: {
        default: [],
        parseHTML: (element) => {
          try {
            const raw = JSON.parse(element.getAttribute('data-items') || '[]');
            return raw.map((item: any) => {
              if (Array.isArray(item.path)) {
                return item as IndexItem;
              }
              // Migration for legacy structural format
              const numStr = typeof item.num === 'string' ? item.num : '';
              const parts = numStr.split('.').filter(Boolean).map(Number);
              return {
                path: parts.length > 0 ? parts : [1],
                text: item.text || '',
                slug: item.slug || '',
              } as IndexItem;
            });
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({
          'data-items': JSON.stringify(attributes.items || []),
        }),
      },
      lang: {
        default: 'gl',
        parseHTML: (element) => element.getAttribute('lang') || 'gl',
        renderHTML: (attributes) => ({
          lang: attributes.lang,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'nav[data-type="article-index"]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          let items: IndexItem[] = [];
          try {
            items = JSON.parse(el.getAttribute('data-items') || '[]');
          } catch {
            items = [];
          }
          return {
            items,
            lang: el.getAttribute('lang') || 'gl',
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const items = (node.attrs.items || []) as IndexItem[];
    const lang = node.attrs.lang || 'gl';
    const label = lang === 'es' ? 'Índice' : 'Índice';
    const ariaLabel = lang === 'es' ? 'Índice del artículo' : 'Índice do artigo';

    const rows: DOMOutputSpec[] = items.map((item) => {
      const level = item.path.length;
      const num = item.path.join('.') + '.';
      const indent = level === 1 ? '0' : level === 2 ? '1.5rem' : '3rem';
      const fontSize = level === 1 ? '1.15rem' : level === 2 ? '1.05rem' : '0.95rem';
      const fontWeight = level === 1 ? '600' : '400';
      const opacity = level === 3 ? '0.75' : level === 2 ? '0.9' : '1';
      const numWidth = level === 1 ? '1.75rem' : level === 2 ? '2.75rem' : '3.75rem';

      return [
        'div',
        {
          class: `index-row index-level-${level}`,
          role: 'listitem',
          style: `display: flex; align-items: baseline; gap: 0.5rem; padding: 0.25rem 0 0.25rem ${indent}; margin: 0;`,
        },
        [
          'span',
          {
            class: 'index-num',
            style: `color: var(--color-gold); font-size: 0.95rem; font-weight: 600; letter-spacing: 0.02em; min-width: ${numWidth}; flex-shrink: 0; font-variant-numeric: tabular-nums; font-family: var(--font-sans);`,
          },
          num,
        ],
        [
          'a',
          {
            href: `#${item.slug}`,
            class: 'index-link',
            style: `color: var(--color-charcoal); opacity: ${opacity}; text-decoration: none; font-size: ${fontSize}; font-weight: ${fontWeight}; line-height: 1.5; font-family: var(--font-serif); transition: opacity 0.2s;`,
          },
          item.text,
        ],
      ];
    });

    return [
      'nav',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'article-index',
        'aria-label': ariaLabel,
        class: 'article-index-block',
        style:
          'border-top: 1px solid rgba(197, 160, 89, 0.4); border-bottom: 1px solid rgba(197, 160, 89, 0.4); padding: 1.5rem 0; margin-bottom: 2.5rem;',
      }),
      [
        'div',
        {
          class: 'index-label',
          style:
            'display: block; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-gold); margin-bottom: 1rem; font-family: var(--font-sans);',
        },
        label,
      ],
      [
        'div',
        {
          class: 'index-list',
          role: 'list',
          style: 'display: flex; flex-direction: column; gap: 0.25rem;',
        },
        ...rows,
      ],
    ];
  },

  addCommands() {
    return {
      insertArticleIndex:
        ({ items, lang }) =>
        ({ commands, state, dispatch }) => {
          let existingPos: number | null = null;
          let existingSize = 0;

          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              existingPos = pos;
              existingSize = node.nodeSize;
              return false;
            }
          });

          const node = this.type.create({ items, lang });

          if (existingPos !== null) {
            if (dispatch) {
              const tr = state.tr.replaceWith(existingPos, existingPos + existingSize, node);
              dispatch(tr);
            }
            return true;
          }

          return commands.insertContentAt(0, {
            type: this.name,
            attrs: { items, lang },
          });
        },
    };
  },
});
