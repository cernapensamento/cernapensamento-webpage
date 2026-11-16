import { Node, mergeAttributes } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import {
  INDEX_BLOCK_STYLES,
  getIndexLabels,
  getIndexRowStyles,
  type IndexItem,
  type Slug,
} from './generateIndex';

export type { IndexItem, Slug };

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    articleIndex: {
      insertArticleIndex: (options: { items: IndexItem[]; lang: string }) => ReturnType;
    };
  }
}

/**
 * Normalizes a parsed item, migrating legacy `{ num: "1.2", text, slug }` entries
 * into the current `{ path: [1, 2], text, slug }` shape.
 */
function normalizeIndexItem(raw: unknown): IndexItem {
  const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const text = typeof item.text === 'string' ? item.text : '';
  const slug = (typeof item.slug === 'string' ? item.slug : '') as Slug;

  if (Array.isArray(item.path)) {
    return { path: item.path as number[], text, slug };
  }

  const numStr = typeof item.num === 'string' ? item.num : '';
  const parts = numStr.split('.').filter(Boolean).map(Number);

  return {
    path: parts.length > 0 ? parts : [1],
    text,
    slug,
  };
}

function parseIndexItems(rawAttr: string | null): IndexItem[] {
  if (!rawAttr) return [];
  try {
    const parsed = JSON.parse(rawAttr);
    return Array.isArray(parsed) ? parsed.map(normalizeIndexItem) : [];
  } catch {
    return [];
  }
}

function buildIndexRowSpec(item: IndexItem): DOMOutputSpec {
  const level = item.path.length;
  const num = `${item.path.join('.')}.`;
  const styles = getIndexRowStyles(level);

  return [
    'div',
    {
      class: `index-row index-level-${level}`,
      role: 'listitem',
      style: styles.row,
    },
    [
      'span',
      {
        class: 'index-num',
        style: styles.num,
      },
      num,
    ],
    [
      'a',
      {
        href: `#${item.slug}`,
        class: 'index-link',
        style: styles.link,
      },
      item.text,
    ],
  ];
}

export const ArticleIndex = Node.create({
  name: 'articleIndex',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: false,

  addAttributes() {
    return {
      items: {
        default: [],
        parseHTML: (element) => parseIndexItems(element.getAttribute('data-items')),
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
    return [{ tag: 'nav[data-type="article-index"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const items = (node.attrs.items || []) as IndexItem[];
    const lang = (node.attrs.lang as string) || 'gl';
    const { label, ariaLabel } = getIndexLabels(lang);

    return [
      'nav',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'article-index',
        'aria-label': ariaLabel,
        class: 'article-index-block',
        style: INDEX_BLOCK_STYLES.nav,
      }),
      [
        'div',
        {
          class: 'index-label',
          style: INDEX_BLOCK_STYLES.label,
        },
        label,
      ],
      [
        'div',
        {
          class: 'index-list',
          role: 'list',
          style: INDEX_BLOCK_STYLES.list,
        },
        ...items.map(buildIndexRowSpec),
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

          if (existingPos !== null) {
            if (dispatch) {
              const node = this.type.create({ items, lang });
              dispatch(state.tr.replaceWith(existingPos, existingPos + existingSize, node));
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
