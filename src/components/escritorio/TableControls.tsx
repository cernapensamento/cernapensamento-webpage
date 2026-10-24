"use client";

import React from 'react';
import type { Editor } from '@tiptap/react';
import { useParams } from 'next/navigation';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface TableControlsProps {
  editor: Editor | null;
}

export default function TableControls({ editor }: TableControlsProps) {
  const params = useParams();
  const lang = (params?.lang as string) || 'gl';
  const dict = lang === 'es' ? esDict : glDict;
  const tc = dict.articleEditor.tableControls;

  if (!editor || !editor.isActive('table')) {
    return null;
  }

  const highlightColors = [
    { color: '', label: tc.noColor, border: 'border-lines' },
    { color: 'rgba(212, 175, 55, 0.18)', label: tc.gold, bg: 'bg-[#d4af37]/20', border: 'border-gold' },
    { color: 'rgba(0, 0, 0, 0.06)', label: tc.gray, bg: 'bg-charcoal/10', border: 'border-charcoal/30' },
    { color: 'rgba(34, 139, 34, 0.12)', label: tc.green, bg: 'bg-emerald-500/15', border: 'border-emerald-600/40' },
    { color: 'rgba(220, 38, 38, 0.12)', label: tc.red, bg: 'bg-red-500/15', border: 'border-red-500/40' },
  ];

  return (
    <div 
      className="sticky bottom-4 z-20 mx-auto w-full max-w-[800px] mt-4 p-3 bg-surface/95 backdrop-blur-md border border-lines shadow-lg flex flex-wrap items-center justify-between gap-2 text-charcoal text-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
      role="toolbar"
      aria-label={tc.toolbarLabel}
    >
      <div className="flex items-center gap-1 flex-wrap">
        <span className="font-serif font-bold text-xs uppercase tracking-wider text-charcoal/60 mr-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">table</span>
          {tc.table}
        </span>

        {/* Column operations */}
        <div className="flex items-center border border-lines rounded-none bg-parchment/60">
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] font-semibold text-charcoal/80 cursor-pointer"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title={tc.addColumn}
          >
            + Col
          </button>
          <div className="w-[1px] h-4 bg-lines"></div>
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] font-semibold text-charcoal/80 cursor-pointer"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title={tc.deleteColumn}
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
            title={tc.addRow}
          >
            + Fila
          </button>
          <div className="w-[1px] h-4 bg-lines"></div>
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] font-semibold text-charcoal/80 cursor-pointer"
            onClick={() => editor.chain().focus().deleteRow().run()}
            title={tc.deleteRow}
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
            title={tc.headerRowTitle}
          >
            {tc.headerRow}
          </button>
          <div className="w-[1px] h-4 bg-lines"></div>
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-lines/30 transition-colors font-sans text-[11px] cursor-pointer"
            onClick={() => editor.chain().focus().mergeOrSplit().run()}
            title={tc.mergeSplitTitle}
          >
            {tc.mergeSplit}
          </button>
        </div>

        {/* Cell Highlight Colors */}
        <div className="flex items-center gap-1.5 ml-2 border-l border-lines pl-2">
          <span className="text-[10px] uppercase tracking-wider text-charcoal/50 font-sans">
            {tc.color}
          </span>
          {highlightColors.map((item, idx) => (
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
          title={tc.deleteTableTitle}
        >
          {tc.deleteTable}
        </button>
      </div>
    </div>
  );
}
