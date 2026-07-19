import { mergeAttributes, Node } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: { src: string, alt?: string, title?: string, caption?: string }) => ReturnType,
    }
  }
}

export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'inline*',
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        contentElement: 'figcaption',
        getAttrs: node => {
          const img = (node as HTMLElement).querySelector('img');
          if (!img) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
          };
        },
      },
      {
        tag: 'img',
        getAttrs: node => {
          const img = node as HTMLElement;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      { class: 'image-figure w-full my-8' },
      ['img', mergeAttributes(HTMLAttributes, { draggable: false, contenteditable: false, class: 'w-full object-cover' })],
      ['figcaption', { class: 'text-center text-base text-charcoal/60 italic mt-2' }, 0],
    ];
  },
  
  addCommands() {
    return {
      setFigure: ({ src, alt, title, caption }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { src, alt, title },
          content: caption ? [{ type: 'text', text: caption }] : [],
        });
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection;
        
        if (empty) {
          const parentNode = $anchor.parent;
          if (parentNode.type.name === this.name) {
            // Si la leyenda está vacía y se pulsa borrar, se elimina toda la figura (imagen incluida)
            if (parentNode.textContent.length === 0) {
              return this.editor.commands.deleteNode(this.name);
            }
          }
        }
        return false;
      },
    };
  },
});
