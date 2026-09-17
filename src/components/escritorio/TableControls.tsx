"use client";

import React from 'react';
import type { Editor } from '@tiptap/react';

interface TableControlsProps {
  editor: Editor | null;
}

const HIGHLIGHT_COLORS = [
  { color: '', label: 'Sin cor / Sin color', border: 'border-lines' },
  { color: 'rgba(212, 175, 55, 0.18)', label: 'Dourado / Dorado', bg: 'bg-[#d4af37]/20', border: 'border-gold' },
  { color: 'rgba(0, 0, 0, 0.06)', label: 'Gris / Gris', bg: 'bg-charcoal/10', border: 'border-charcoal/30' },
  { color: 'rgba(34, 139, 34, 0.12)', label: 'Verde / Verde', bg: 'bg-emerald-500/15', border: 'border-emerald-600/40' },
  { color: 'rgba(220, 38, 38, 0.12)', label: 'Vermello / Rojo', bg: 'bg-red-500/15', border: 'border-red-500/40' },
];

export default function TableControls({ editor }: TableControlsProps) {
  if (!editor || !editor.isActive('table')) {
    return null;
  }

  return (
    <div 
      className="sticky bottom-4 z-20 mx-auto w-full max-w-[800px] mt-4 p-3 bg-surface/95 backdrop-blur-md border border-lines shadow-lg flex flex-wrap items-center justify-between gap-2 text-charcoal text-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
      role="toolbar"
      aria-label="Controis de táboa / Controles de tabla"
    >
      <div className="flex items-center gap-1 flex-wrap">
        <span className="font-serif font-bold text-xs uppercase tracking-wider text-charcoal/60 mr-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">table</span>
          Táboa / Tabla
        </span>

        {/* Column operations */}
        <div className="flex items-center border border-lines rounded-none bg-parchment/60">
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] font-semibold text-charcoal/80 cursor-pointer"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Engadir columna á dereita / Añadir columna a la derecha"
          >
            + Col
          </button>
          <div className="w-[1px] h-4 bg-lines"></div>
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] font-semibold text-charcoal/80 cursor-pointer"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Eliminar columna / Eliminar columna"
          >
            − Col
          </button>
        </div>

        {/* Row operations */}
        <div className="flex items-center border border-lines rounded-none bg-parchment/60 ml-1">
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] font-semibold text-charcoal/80 cursor-pointer"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Engadir fila abaixo / Añadir fila abajo"
          >
            + Fila
          </button>
          <div className="w-[1px] h-4 bg-lines"></div>
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] font-semibold text-charcoal/80 cursor-pointer"
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Eliminar fila / Eliminar fila"
          >
            − Fila
          </button>
        </div>

        {/* Header & Merging */}
        <div className="flex items-center border border-lines rounded-none bg-parchment/60 ml-1">
          <button
            type="button"
            className={`px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] cursor-pointer ${
              editor.isActive('tableHeader') ? 'bg-lines/40 font-bold' : ''
            }`}
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            title="Alternar fila de cabeceira / Alternar fila de cabecera"
          >
            Cabeceira
          </button>
          <div className="w-[1px] h-4 bg-lines"></div>
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] cursor-pointer"
            onClick={() => editor.chain().focus().mergeOrSplit().run()}
            title="Unir ou dividir celas / Unir o dividir celdas"
          >
            Unir / Dividir
          </button>
        </div>

        {/* Cell Highlight Colors */}
        <div className="flex items-center gap-1.5 ml-2 border-l border-lines pl-2">
          <span className="text-[10px] uppercase tracking-wider text-charcoal/50 font-sans">Cor:</span>
          {HIGHLIGHT_COLORS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={`w-5 h-5 rounded-full border ${item.border} ${item.bg || 'bg-transparent'} hover:scale-110 transition-transform cursor-pointer relative`}
              title={item.label}
              onClick={() => {
                if (!item.color) {
                  editor.chain().focus().setCellAttribute('backgroundColor', null).run();
                } else {
                  editor.chain().focus().setCellAttribute('backgroundColor', item.color).run();
                }
              }}
            >
              {!item.color && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-charcoal/40 font-bold">
                  ✕
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Delete Table button */}
      <div>
        <button
          type="button"
          className="px-2.5 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/40 transition-colors font-sans text-[11px] uppercase tracking-wider cursor-pointer"
          onClick={() => editor.chain().focus().deleteTable().run()}
          title="Eliminar táboa completa / Eliminar tabla completa"
        >
          Eliminar táboa
        </button>
      </div>
    </div>
  );
}
