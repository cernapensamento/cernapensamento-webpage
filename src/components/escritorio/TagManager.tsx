"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getAllTagsWithAllTranslations,
  createTagWithTranslations,
  formatDbError,
  type TagWithAllTranslations,
} from '@/lib/db';
import { useToast } from '@/components/ui/FeedbackProvider';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';
import { i18n, type Locale } from '@/i18n-config';

interface TagManagerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

function createEmptyTagTranslations(): Record<Locale, string> {
  return Object.fromEntries(
    i18n.locales.map((loc) => [loc, ''])
  ) as Record<Locale, string>;
}

function getTranslatedName(tag: TagWithAllTranslations, targetLang: string): string {
  const match = tag.tag_translations?.find((t) => t.lang === targetLang);
  if (match?.name) return match.name;
  const fallback = tag.tag_translations?.find((t) => t.lang === i18n.defaultLocale);
  return fallback?.name || tag.tag_translations?.[0]?.name || tag.slug;
}

function slugifyTagName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function TagManager({ selectedTags, onChange }: TagManagerProps) {
  const lang = useLocale();
  const dict = getDictionaryClient(lang);
  const edDict = dict.articleEditor;
  const toast = useToast();

  const supabase = useMemo(() => createClient(), []);
  const [allTags, setAllTags] = useState<TagWithAllTranslations[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [newTagNames, setNewTagNames] = useState<Record<Locale, string>>(
    createEmptyTagTranslations
  );
  const [isSaving, setIsSaving] = useState(false);

  const fetchTags = useCallback(async () => {
    const data = await getAllTagsWithAllTranslations(supabase);
    setAllTags(data);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    getAllTagsWithAllTranslations(supabase).then((data) => {
      if (isMounted) {
        setAllTags(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleAddExisting = (slug: string) => {
    if (!selectedTags.includes(slug)) {
      onChange([...selectedTags, slug]);
    }
    setSearch('');
  };

  const handleRemove = (slug: string) => {
    onChange(selectedTags.filter((t) => t !== slug));
  };

  const handleCreateNew = async () => {
    const hasMissing = i18n.locales.some((loc) => !newTagNames[loc]?.trim());
    if (hasMissing) {
      toast.warning(edDict.allLangsRequired);
      return;
    }

    const baseName =
      newTagNames[i18n.defaultLocale] ||
      Object.values(newTagNames).find((v) => v.trim()) ||
      '';
    const slug = slugifyTagName(baseName);
    if (!slug) {
      toast.warning(edDict.allLangsRequired);
      return;
    }

    setIsSaving(true);
    try {
      const translations = i18n.locales.map((loc) => ({
        lang: loc,
        name: newTagNames[loc].trim(),
      }));

      const { success, error } = await createTagWithTranslations(
        slug,
        translations,
        supabase
      );

      if (!success || error) {
        const message = error ? formatDbError(error) : dict.dashboard.unknownError;
        toast.error(edDict.createTagError + message);
        return;
      }

      await fetchTags();
      handleAddExisting(slug);
      setShowModal(false);
      setNewTagNames(createEmptyTagTranslations());
    } catch (e: unknown) {
      toast.error(
        edDict.createTagError + (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedSearch = search.toLowerCase();
  const otherLocales = i18n.locales.filter((loc) => loc !== lang);

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedTags.map((slug) => {
          const tagObj = allTags.find((t) => t.slug === slug);
          const name = tagObj ? getTranslatedName(tagObj, lang) : slug;
          return (
            <button
              type="button"
              key={slug}
              className="flex items-center gap-1 px-3 py-1 bg-lines/30 text-charcoal text-[10px] uppercase tracking-[0.15em] rounded-sm group cursor-pointer hover:bg-red-500/10 hover:text-red-700 transition-colors"
              onClick={() => handleRemove(slug)}
              title={dict.feedback.delete}
            >
              {name}
              <span
                className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100"
                style={{ fontFamily: 'Material Symbols Outlined' }}
              >
                close
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <input
          className="w-full border border-lines bg-transparent font-sans text-xs text-charcoal tracking-widest uppercase focus:outline-none focus:border-gold p-2"
          placeholder={edDict.searchTagPlaceholder}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-lines shadow-lg z-50 max-h-48 overflow-y-auto">
            {allTags
              .filter(
                (t) =>
                  t.slug.includes(normalizedSearch) ||
                  t.tag_translations?.some((tr) =>
                    tr.name.toLowerCase().includes(normalizedSearch)
                  )
              )
              .map((t) => {
                const otherNames = otherLocales
                  .map((loc) => getTranslatedName(t, loc))
                  .join(' / ');
                return (
                  <button
                    type="button"
                    key={t.slug}
                    className="w-full text-left px-4 py-2 text-xs uppercase tracking-widest hover:bg-gold/10 hover:text-gold transition-colors"
                    onClick={() => handleAddExisting(t.slug)}
                  >
                    {getTranslatedName(t, lang)}{' '}
                    {otherNames && (
                      <span className="text-[10px] text-charcoal/50">
                        ({otherNames})
                      </span>
                    )}
                  </button>
                );
              })}

            <button
              type="button"
              className="w-full text-left px-4 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-parchment transition-colors border-t border-lines"
              onClick={() => setShowModal(true)}
            >
              {edDict.createTagBtn} &quot;{search}&quot;
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-surface p-8 max-w-md w-full border border-lines shadow-2xl">
            <h2 className="font-serif text-2xl text-charcoal mb-4">
              {edDict.newTagTitle}
            </h2>
            <p className="text-xs font-sans text-charcoal/70 mb-6 uppercase tracking-widest">
              {edDict.newTagNotice}
            </p>

            <div className="space-y-4 mb-8">
              {i18n.locales.map((loc) => {
                const localeLabel = i18n.localeLabels[loc] || loc.toUpperCase();
                return (
                  <div key={loc}>
                    <label className="block text-xs uppercase tracking-widest text-charcoal/70 mb-1">
                      {edDict.tagTranslationIn} {localeLabel}
                    </label>
                    <input
                      type="text"
                      className="w-full border border-lines p-2 bg-transparent focus:border-gold outline-none"
                      value={newTagNames[loc]}
                      onChange={(e) =>
                        setNewTagNames((prev) => ({
                          ...prev,
                          [loc]: e.target.value,
                        }))
                      }
                      placeholder={edDict.tagExamplePlaceholder}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="px-6 py-2 font-sans text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                {dict.common.cancel}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer disabled:opacity-50"
                disabled={isSaving}
                onClick={handleCreateNew}
              >
                {isSaving ? dict.dashboard.saving : edDict.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
