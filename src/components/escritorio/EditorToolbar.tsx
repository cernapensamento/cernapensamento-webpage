"use client";

import React from 'react';
import Link from 'next/link';
import type { Editor } from '@tiptap/react';
import type { Locale } from '@/i18n-config';
import { getDictionaryClient } from '@/dictionaries/client';
import {
  EDITOR_ACTIONS,
  PERMISSIONS,
  PUBLICATION_STATUSES,
  hasPermission,
  type EditorAction,
  type PermissionValue,
} from '@/lib/db/schema';

const FONT_SIZE_OPTIONS = [
  { value: '9pt', label: '9 pt' },
  { value: '10pt', label: '10 pt' },
  { value: '11pt', label: '11 pt' },
  { value: '12pt', label: '12 pt' },
  { value: 'default', label: '14 pt', isDefault: true },
  { value: '16pt', label: '16 pt' },
  { value: '18pt', label: '18 pt' },
  { value: '20pt', label: '20 pt' },
  { value: '24pt', label: '24 pt' },
  { value: '28pt', label: '28 pt' },
  { value: '32pt', label: '32 pt' },
  { value: '36pt', label: '36 pt' },
] as const;

const HEADING_LEVELS = [1, 2, 3] as const;

interface EditorToolbarProps {
  editor: Editor | null;
  routeLang: Locale;
  mode: 'create' | 'edit';
  permissions?: readonly PermissionValue[];
  publicationStatus?: string;
  isPublishing: boolean;
  showIndex: boolean;
  onInsertImage: () => void;
  onInsertYoutube: () => void;
  onInsertMath: () => void;
  onInsertTable: () => void;
  onToggleShowIndex: () => void;
  onClearAll: () => void;
  onChangeCover: () => void;
  onOpenPreview: () => void;
  onSubmitAction: (action: EditorAction) => void;
  onOpenPublishModal: () => void;
}

export default function EditorToolbar({
  editor,
  routeLang,
  mode,
  permissions,
  publicationStatus,
  isPublishing,
  showIndex,
  onInsertImage,
  onInsertYoutube,
  onInsertMath,
  onInsertTable,
  onToggleShowIndex,
  onClearAll,
  onChangeCover,
  onOpenPreview,
  onSubmitAction,
  onOpenPublishModal,
}: EditorToolbarProps) {
  const dict = getDictionaryClient(routeLang).articleEditor;
  const tools = dict.tools;

  const activeFontSize =
    FONT_SIZE_OPTIONS.find(
      (opt) => !('isDefault' in opt) && editor?.isActive('textStyle', { fontSize: opt.value })
    )?.value || 'default';

  const headingLabels: Record<1 | 2 | 3, string> = {
    1: tools.h1,
    2: tools.h2,
    3: tools.h3,
  };

  const effectivePermissions: readonly PermissionValue[] = permissions ?? [];
  const canPublish = hasPermission(effectivePermissions, PERMISSIONS.PUBLICATIONS_PUBLISH);
  const canReview = hasPermission(effectivePermissions, PERMISSIONS.PUBLICATIONS_REVIEW);
  const isPending = publicationStatus === PUBLICATION_STATUSES.IN_REVIEW;
  const isPublished = publicationStatus === PUBLICATION_STATUSES.PUBLISHED;

  const iconStyle = { fontFamily: 'Material Symbols Outlined' };

  return (
    <div className="sticky top-16 md:top-20 z-40 border-b border-lines bg-parchment/95 dark:bg-[#121212]/95 backdrop-blur-md px-4 md:px-8 py-3 flex flex-col xl:flex-row items-center justify-between gap-3 xl:gap-0 shadow-xs">
      <div className="flex items-center gap-1 text-charcoal/80 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 scrollbar-none">
        <Link
          href={`/${routeLang}/escritorio`}
          className="flex items-center gap-1.5 h-10 px-3 mr-1 text-charcoal/70 hover:text-charcoal hover:bg-lines/40 border border-lines transition-colors text-xs font-sans uppercase tracking-wider shrink-0 cursor-pointer"
          title={dict.backToArticles}
          aria-label={dict.backToArticles}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span className="hidden sm:inline font-semibold">{dict.backToArticles}</span>
        </Link>
        <div className="h-6 w-[1px] shrink-0 bg-lines mx-1 mr-2"></div>

        <button
          type="button"
          aria-label={tools.bold}
          title={tools.bold}
          className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('bold') ? 'bg-lines/30' : ''}`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>format_bold</span>
        </button>

        <button
          type="button"
          aria-label={tools.italic}
          title={tools.italic}
          className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('italic') ? 'bg-lines/30' : ''}`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>format_italic</span>
        </button>

        <select
          aria-label={tools.fontSize}
          title={tools.fontSize}
          className={`h-9 shrink-0 bg-transparent text-xs border px-2 focus:outline-none cursor-pointer transition-colors mx-1 ${
            activeFontSize === 'default'
              ? 'border-gold text-gold font-semibold'
              : 'border-lines text-charcoal/80 focus:border-gold'
          }`}
          value={activeFontSize}
          onChange={(e) => {
            const val = e.target.value;
            const chain = editor?.chain().focus() as unknown as
              | {
                  unsetFontSize: () => { run: () => boolean };
                  setFontSize: (size: string) => { run: () => boolean };
                }
              | undefined;
            if (val === 'default') {
              chain?.unsetFontSize().run();
            } else {
              chain?.setFontSize(val).run();
            }
          }}
        >
          {FONT_SIZE_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={
                'isDefault' in opt
                  ? { backgroundColor: 'rgba(212, 175, 55, 0.25)', color: '#b8860b', fontWeight: 'bold' }
                  : { backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }
              }
            >
              {opt.label}
            </option>
          ))}
        </select>

        <div className="h-6 w-[1px] shrink-0 bg-lines mx-2"></div>

        {HEADING_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            aria-label={headingLabels[level]}
            title={headingLabels[level]}
            className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer font-serif font-bold ${
              editor?.isActive('heading', { level }) ? 'bg-lines/30' : ''
            }`}
            onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
          >
            H{level}
          </button>
        ))}

        <div className="h-6 w-[1px] shrink-0 bg-lines mx-2"></div>

        <button
          type="button"
          aria-label={tools.quote}
          title={tools.quote}
          className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('blockquote') ? 'bg-lines/30' : ''}`}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>format_quote</span>
        </button>

        <button
          type="button"
          aria-label={tools.image}
          title={tools.imageTitle}
          className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer"
          onClick={onInsertImage}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>image</span>
        </button>

        <button
          type="button"
          aria-label={tools.video}
          title={tools.videoTitle}
          className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer"
          onClick={onInsertYoutube}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>smart_display</span>
        </button>

        <button
          type="button"
          aria-label={tools.list}
          title={tools.listShort}
          className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('bulletList') ? 'bg-lines/30' : ''}`}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>format_list_bulleted</span>
        </button>

        <button
          type="button"
          aria-label={tools.justify}
          title={tools.justifyShort}
          className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-lines/30' : ''}`}
          onClick={() => {
            if (editor?.isActive({ textAlign: 'justify' })) {
              editor?.chain().focus().unsetTextAlign().run();
            } else {
              editor?.chain().focus().setTextAlign('justify').run();
            }
          }}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>format_align_justify</span>
        </button>

        <div className="h-6 w-[1px] shrink-0 bg-lines mx-1"></div>

        <button
          type="button"
          aria-label={tools.math}
          title={tools.mathTitle}
          className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer"
          onClick={onInsertMath}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>functions</span>
        </button>

        <button
          type="button"
          aria-label={tools.insertTable}
          title={tools.insertTable}
          className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('table') ? 'bg-lines/30' : ''}`}
          onClick={onInsertTable}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>table_chart</span>
        </button>

        <button
          type="button"
          aria-label={dict.showIndexHint}
          aria-pressed={showIndex}
          title={dict.showIndexHint}
          className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${showIndex ? 'bg-gold/20 text-gold' : ''}`}
          onClick={onToggleShowIndex}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>format_list_numbered</span>
        </button>

        <div className="h-6 w-[1px] shrink-0 bg-lines mx-2"></div>

        <button
          type="button"
          aria-label={tools.clear}
          title={tools.clear}
          className="w-10 h-10 shrink-0 flex items-center justify-center text-charcoal hover:bg-lines/30 transition-colors cursor-pointer"
          onClick={onClearAll}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>delete_sweep</span>
        </button>

        <button
          type="button"
          aria-label={tools.changeCover}
          title={tools.coverShort}
          className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer"
          onClick={onChangeCover}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>add_a_photo</span>
        </button>

        <button
          type="button"
          aria-label={dict.preview}
          title={dict.preview}
          className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer"
          onClick={onOpenPreview}
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>visibility</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 scrollbar-none">
        <span className="text-[10px] font-sans uppercase tracking-widest text-charcoal/50 italic hidden xl:block shrink-0"></span>
        {isPending && canReview && mode === 'edit' ? (
          <>
            <button
              type="button"
              className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50"
              disabled={isPublishing}
              onClick={() => onSubmitAction(EDITOR_ACTIONS.REJECT)}
            >
              {dict.reject}
            </button>
            <button
              type="button"
              className="px-3 md:px-4 py-2 shrink-0 bg-gold text-parchment text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal transition-all cursor-pointer disabled:opacity-50"
              disabled={isPublishing}
              onClick={() => onSubmitAction(EDITOR_ACTIONS.APPROVE)}
            >
              {dict.approveAndPublish}
            </button>
          </>
        ) : isPending && !canReview && mode === 'edit' ? (
          <button
            type="button"
            className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50"
            disabled={isPublishing}
            onClick={() => onSubmitAction(EDITOR_ACTIONS.REVOKE_APPROVAL)}
          >
            <span className="hidden sm:inline">{dict.revokeApproval}</span>
            <span className="sm:hidden" aria-hidden="true">{dict.saveDraftShort}</span>
          </button>
        ) : (
          <>
            {mode === 'edit' && isPublished ? (
              <button
                type="button"
                className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50"
                disabled={isPublishing}
                onClick={() => onSubmitAction(EDITOR_ACTIONS.DRAFT)}
              >
                {dict.unpublish}
              </button>
            ) : (
              <button
                type="button"
                className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50"
                disabled={isPublishing}
                onClick={() => onSubmitAction(EDITOR_ACTIONS.DRAFT)}
              >
                <span className="hidden sm:inline">{dict.saveDraft}</span>
                <span className="sm:hidden" aria-hidden="true">{dict.saveDraftShort}</span>
              </button>
            )}
            <button
              type="button"
              className="px-3 md:px-4 py-2 shrink-0 bg-charcoal text-parchment text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-gold transition-all cursor-pointer disabled:opacity-50"
              disabled={isPublishing}
              onClick={() => {
                if (!canPublish) {
                  onSubmitAction(EDITOR_ACTIONS.SUBMIT_APPROVAL);
                } else {
                  onOpenPublishModal();
                }
              }}
            >
              {!canPublish ? dict.sendForApproval : dict.publish}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
