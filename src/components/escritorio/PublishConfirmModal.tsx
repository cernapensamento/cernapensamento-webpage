"use client";

import React from 'react';
import { i18n, type Locale } from '@/i18n-config';
import type { PublicationLanguageMode } from '@/lib/i18n/publicationLanguage';
import { getDictionaryClient } from '@/dictionaries/client';

interface PublishConfirmModalProps {
  routeLang: Locale;
  mode: 'create' | 'edit';
  isPublishing: boolean;
  languageMode: PublicationLanguageMode;
  activeLang: Locale;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function PublishConfirmModal({
  routeLang,
  mode,
  isPublishing,
  languageMode,
  activeLang,
  onCancel,
  onConfirm,
}: PublishConfirmModalProps) {
  const dict = getDictionaryClient(routeLang).articleEditor;
  const activeLanguageLabel = i18n.localeLabels[activeLang] || activeLang.toUpperCase();
  const languageSummary =
    languageMode === 'monolingual'
      ? dict.publishLanguagesOnly.replace('{language}', activeLanguageLabel)
      : dict.publishLanguagesBoth;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm">
      <div className="bg-surface p-8 max-w-md w-full border border-lines shadow-2xl">
        <h2 className="font-serif text-2xl text-charcoal mb-4">
          {mode === 'create' ? dict.publishModalTitleCreate : dict.publishModalTitleEdit}
        </h2>
        <p className="font-sans text-sm text-charcoal/70 mb-4">
          {mode === 'create' ? dict.publishModalDescCreate : dict.publishModalDescEdit}
        </p>
        <div className="mb-8 px-3 py-2 border border-lines bg-parchment/60 font-sans text-xs text-charcoal/80">
          <span className="uppercase tracking-widest text-gold font-bold mr-2">
            {dict.publishLanguagesSummaryLabel}
          </span>
          <span className="font-semibold">{languageSummary}</span>
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="px-6 py-2 font-sans text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors cursor-pointer"
            onClick={onCancel}
          >
            {dict.cancel}
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer disabled:opacity-50"
            disabled={isPublishing}
            onClick={onConfirm}
          >
            {isPublishing
              ? mode === 'create'
                ? dict.publishing
                : dict.saving
              : dict.publish}
          </button>
        </div>
      </div>
    </div>
  );
}
