import { InlineMath, BlockMath } from '@tiptap/extension-mathematics';
import { InputRule, Extension } from '@tiptap/core';

export const CustomInlineMath = InlineMath.extend({
  addInputRules() {
    return [
      ...(this.parent?.() || []),
      new InputRule({
        find: /(?<!\$)\$([^$\n]+?)\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1];
          if (!latex || !latex.trim()) return;
          const { tr } = state;
          tr.replaceWith(range.from, range.to, this.type.create({ latex: latex.trim() }));
        },
      }),
    ];
  },
});

export const CustomBlockMath = BlockMath.extend({
  addInputRules() {
    return [
      ...(this.parent?.() || []),
      new InputRule({
        find: /^\$\$([^$]+)\$\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1];
          if (!latex || !latex.trim()) return;
          const { tr } = state;
          const node = this.type.create({ latex: latex.trim() });
          tr.replaceRangeWith(range.from, range.to, node);
        },
      }),
    ];
  },
});

export const MathKit = Extension.create({
  name: 'mathKit',
  addExtensions() {
    return [
      CustomInlineMath,
      CustomBlockMath,
    ];
  },
});
