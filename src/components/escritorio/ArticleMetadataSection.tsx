"use client";

import React from 'react';
import { i18n, isSupportedLocale, type Locale } from '@/i18n-config';
import type { PublicationLanguageMode } from '@/lib/i18n/publicationLanguage';
import { getDictionaryClient } from '@/dictionaries/client';
import { PUBLICATION_TYPES } from '@/lib/db/schema';
import TagManager from '@/components/escritorio/TagManager';

const PUBLICATION_TYPE_OPTIONS = Object.values(PUBLICATION_TYPES);

function autoResizeTextarea(target: HTMLTextAreaElement): void {
  target.style.height = 'auto';
  target.style.height = `${target.scrollHeight}px`;
}

interface ArticleMetadataSectionProps {
  routeLang: Locale;
  activeLang: Locale;
  onSwitchLang: (loc: Locale) => void;
  languageMode: PublicationLanguageMode;
  onToggleLanguageMode: () => void;
  isTranslating: boolean;
  onTranslate: () => void;
  canTranslate?: boolean;
  tags: string[];
  onChangeTags: (tags: string[]) => void;
  publicationType: string;
  onChangeType: (type: string) => void;
  originalLanguage: Locale;
  onChangeOriginalLanguage: (lang: Locale) => void;
  title: string;
  onChangeTitle: (value: string) => void;
  subtitle: string;
  onChangeSubtitle: (value: string) => void;
}

export default function ArticleMetadataSection({
  routeLang,
  activeLang,
  onSwitchLang,
  languageMode,
  onToggleLanguageMode,
  isTranslating,
  onTranslate,
  canTranslate = false,
  tags,
  onChangeTags,
  publicationType,
  onChangeType,
  originalLanguage,
  onChangeOriginalLanguage,
  title,
  onChangeTitle,
  subtitle,
  onChangeSubtitle,
}: ArticleMetadataSectionProps) {
  const routeDict = getDictionaryClient(routeLang);
  const dict = routeDict.articleEditor;
  const docTypes = routeDict.documentTypes as Record<string, string>;
  const activeEditorDict = getDictionaryClient(activeLang).articleEditor;

  const isMonolingual = languageMode === 'monolingual';
  const visibleTabs = isMonolingual ? [activeLang] : i18n.locales;
  const targetLangs = i18n.locales.filter((loc) => loc !== activeLang);
  const translateTargetLabels = targetLangs
    .map((loc) => i18n.localeLabels[loc] || loc.toUpperCase())
    .join(', ');

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-lines">
        <div className="flex items-center gap-4">
          {visibleTabs.map((loc) => {
            const label = i18n.localeLabels[loc] || loc.toUpperCase();
            return (
              <button
                key={loc}
                type="button"
                onClick={() => onSwitchLang(loc)}
                className={`font-sans text-xs uppercase tracking-widest font-bold pb-1 border-b-2 transition-colors ${
                  activeLang === loc
                    ? 'border-charcoal text-charcoal'
                    : 'border-transparent text-charcoal/40 hover:text-charcoal/70'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isMonolingual}
            aria-label={dict.languageModeLabel}
            title={dict.languageModeHint}
            onClick={onToggleLanguageMode}
            className={`flex items-center gap-2 border px-3 py-1.5 text-[10px] font-sans uppercase tracking-widest font-bold transition-colors cursor-pointer ${
              isMonolingual
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-lines bg-transparent text-charcoal/70 hover:border-gold/60 hover:text-charcoal'
            }`}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontFamily: 'Material Symbols Outlined' }}
            >
              translate
            </span>
            <span>
              {isMonolingual ? dict.languageModeMonolingual : dict.languageModeBilingual}
            </span>
          </button>
          {canTranslate && !isMonolingual && targetLangs.length > 0 && (
            <button
              type="button"
              onClick={onTranslate}
              disabled={isTranslating}
              className="flex items-center gap-2 px-3 py-1.5 border border-gold/50 text-gold hover:bg-gold hover:text-parchment text-[10px] font-sans uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontFamily: 'Material Symbols Outlined' }}
              >
                translate
              </span>
              {isTranslating
                ? dict.translating
                : `${dict.translateTo}${translateTargetLabels}`}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 flex flex-col">
        <div>
          <TagManager selectedTags={tags} onChange={onChangeTags} />
        </div>
        <div className="mb-4 flex flex-wrap gap-4">
          <select
            aria-label={dict.articleType}
            className="bg-transparent text-gold uppercase text-xs tracking-widest font-bold border border-lines p-2 focus:outline-none focus:border-gold cursor-pointer"
            value={publicationType}
            onChange={(e) => onChangeType(e.target.value)}
            style={{ colorScheme: 'light dark' }}
          >
            {PUBLICATION_TYPE_OPTIONS.map((type) => {
              const label =
                docTypes[type.toLowerCase()] ||
                type.charAt(0).toUpperCase() + type.slice(1);
              return (
                <option
                  key={type}
                  value={type}
                  style={{
                    backgroundColor: 'var(--dynamic-surface)',
                    color: 'var(--dynamic-charcoal)',
                  }}
                >
                  {label}
                </option>
              );
            })}
          </select>

          {isMonolingual ? (
            <select
              aria-label={dict.monolingualLangLabel}
              className="bg-transparent text-gold uppercase text-xs tracking-widest font-bold border border-lines p-2 focus:outline-none focus:border-gold cursor-pointer"
              value={activeLang}
              onChange={(e) => {
                const val = e.target.value;
                if (isSupportedLocale(val)) onSwitchLang(val);
              }}
              style={{ colorScheme: 'light dark' }}
            >
              {i18n.locales.map((loc) => {
                const label = i18n.localeLabels[loc] || loc.toUpperCase();
                return (
                  <option
                    key={loc}
                    value={loc}
                    style={{
                      backgroundColor: 'var(--dynamic-surface)',
                      color: 'var(--dynamic-charcoal)',
                    }}
                  >
                    {`${dict.monolingualIn} ${label}`}
                  </option>
                );
              })}
            </select>
          ) : (
            <select
              aria-label={dict.originalLang}
              className="bg-transparent text-gold uppercase text-xs tracking-widest font-bold border border-lines p-2 focus:outline-none focus:border-gold cursor-pointer"
              value={originalLanguage}
              onChange={(e) => {
                const val = e.target.value;
                if (isSupportedLocale(val)) onChangeOriginalLanguage(val);
              }}
              style={{ colorScheme: 'light dark' }}
            >
              {i18n.locales.map((loc) => {
                const label = i18n.localeLabels[loc] || loc.toUpperCase();
                return (
                  <option
                    key={loc}
                    value={loc}
                    style={{
                      backgroundColor: 'var(--dynamic-surface)',
                      color: 'var(--dynamic-charcoal)',
                    }}
                  >
                    {`${dict.originalIn} ${label}`}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <textarea
          className="w-full border-none bg-transparent font-serif text-4xl text-charcoal focus:ring-0 placeholder:text-charcoal/30 resize-none overflow-hidden outline-none"
          onChange={(e) => {
            autoResizeTextarea(e.currentTarget);
            onChangeTitle(e.currentTarget.value);
          }}
          placeholder={activeEditorDict.titlePlaceholder}
          value={title}
          rows={1}
        />
        <textarea
          className="w-full border-none bg-transparent font-serif text-xl text-charcoal/60 italic focus:ring-0 placeholder:text-charcoal/30 resize-none overflow-hidden outline-none"
          onChange={(e) => {
            autoResizeTextarea(e.currentTarget);
            onChangeSubtitle(e.currentTarget.value);
          }}
          placeholder={activeEditorDict.subtitlePlaceholder}
          value={subtitle}
          rows={1}
        />
      </div>
    </>
  );
}
