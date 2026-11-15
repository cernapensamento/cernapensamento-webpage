"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArticleEditor, {
  ArticleData,
  EditorAction,
} from '@/components/escritorio/ArticleEditor';
import type { LocalizedString, PublicationDetail } from '@/lib/db/types';
import { useToast } from '@/components/ui/FeedbackProvider';
import { saveArticleAction, type SaveArticleInput } from '@/actions/articles';
import { isDraftAction } from '@/lib/db/schema';
import { getDictionaryClient } from '@/dictionaries/client';
import { i18n, resolveLocale, type Locale } from '@/i18n-config';

type ArticleEditorDict = ReturnType<typeof getDictionaryClient>['articleEditor'];

export interface BuildEditorSaveInputOptions {
  id?: string;
  action: EditorAction;
  lang?: Locale | string;
}

function collectLocalizedField(
  data: ArticleData,
  field: 'title' | 'subtitle' | 'content',
  legacyPrefix: 'titulo' | 'subtitulo' | 'contenido'
): Record<string, string> {
  const dataRecord = data as Record<string, unknown>;
  const fieldMap = data[field] as LocalizedString | null | undefined;
  const locales = new Set<string>(i18n.locales);

  if (fieldMap && typeof fieldMap === 'object') {
    for (const key of Object.keys(fieldMap)) {
      locales.add(key);
    }
  }

  const prefixWithUnderscore = `${legacyPrefix}_`;
  for (const key of Object.keys(dataRecord)) {
    if (key.startsWith(prefixWithUnderscore)) {
      const loc = key.slice(prefixWithUnderscore.length);
      if (loc) locales.add(loc);
    }
  }

  const result: Record<string, string> = {};
  for (const loc of locales) {
    const primaryVal = fieldMap?.[loc];
    const legacyVal = dataRecord[`${legacyPrefix}_${loc}`];
    result[loc] =
      (typeof primaryVal === 'string' && primaryVal ? primaryVal : '') ||
      (typeof legacyVal === 'string' && legacyVal ? legacyVal : '') ||
      '';
  }

  return result;
}

/**
 * Builds a locale-agnostic `SaveArticleInput` payload from editor form state,
 * collecting all configured locales plus any extra keys and legacy aliases.
 */
export function buildEditorSaveInput(
  data: ArticleData,
  options: BuildEditorSaveInputOptions
): SaveArticleInput {
  const title = collectLocalizedField(data, 'title', 'titulo');
  const subtitleMap = collectLocalizedField(data, 'subtitle', 'subtitulo');
  const hasSubtitle = Object.values(subtitleMap).some(Boolean);
  const content = collectLocalizedField(data, 'content', 'contenido');

  return {
    ...(options.id ? { id: options.id } : {}),
    title,
    subtitle: hasSubtitle ? subtitleMap : null,
    content,
    cover_image_url: data.cover_image_url || data.imagen_url || null,
    tags: data.tags || data.tematicas || [],
    type: data.type || data.tipo,
    original_language: data.original_language || data.idioma_original || i18n.defaultLocale,
    show_index: Boolean(data.show_index),
    action: options.action,
    lang: options.lang || i18n.defaultLocale,
  };
}

interface Props {
  publication?: PublicationDetail;
  /** Backwards compatibility alias for publication */
  articulo?: PublicationDetail;
  userRole: string;
  lang?: string;
  dict?: ArticleEditorDict;
}

export default function EditarArticuloForm({
  publication,
  articulo,
  userRole,
  lang = i18n.defaultLocale,
  dict: propDict,
}: Props) {
  const pub = publication || articulo;
  if (!pub) {
    throw new Error('EditarArticuloForm requires a publication prop');
  }

  const locale = resolveLocale(lang);
  const dict = propDict || getDictionaryClient(locale).articleEditor;
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const initialData: ArticleData = {
    id: pub.id,
    title: pub.title,
    subtitle: pub.subtitle,
    content: pub.content,
    cover_image_url: pub.cover_image_url,
    tags: pub.tags?.map((t) => t.slug) || [],
    status: pub.status,
    type: pub.type,
    original_language: pub.original_language,
    show_index: pub.show_index ?? false,
    published_at: pub.published_at,
  };

  const handleSave = async (data: ArticleData, action: EditorAction): Promise<boolean> => {
    setIsPublishing(true);
    try {
      const result = await saveArticleAction(
        buildEditorSaveInput(data, {
          id: pub.id,
          action,
          lang: locale,
        })
      );

      if (!result.success) {
        toast.error(result.error || dict.saveError);
        return false;
      }

      toast.success(isDraftAction(action) ? dict.draftUpdated : dict.actionSuccess);

      router.push(`/${locale}/escritorio`);
      return true;
    } catch (error: unknown) {
      console.error('[EditarArticuloForm] Unexpected error on save:', error);
      toast.error(dict.unexpectedError);
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ArticleEditor
      mode="edit"
      initialData={initialData}
      onSave={handleSave}
      isPublishing={isPublishing}
      userRole={userRole}
    />
  );
}
