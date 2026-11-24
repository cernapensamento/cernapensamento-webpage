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
import { getDictionaryClient, type Dictionary } from '@/dictionaries/client';
import { i18n, type Locale } from '@/i18n-config';
import { useLocale } from '@/hooks/useLocale';

type ArticleEditorDict = Partial<Dictionary['articleEditor']>;

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
  mode?: 'create' | 'edit';
  publication?: PublicationDetail;
  /** Backwards compatibility alias for publication */
  articulo?: PublicationDetail;
  userRole: string;
  lang?: string;
  dict?: ArticleEditorDict;
}

function buildLocalizedField(
  localized?: LocalizedString | null,
  legacyValues?: Record<string, string | undefined>
): LocalizedString {
  const result: Record<string, string> = {};
  for (const loc of i18n.locales) {
    result[loc] = '';
  }

  if (localized) {
    for (const [loc, value] of Object.entries(localized)) {
      if (typeof value === 'string') {
        result[loc] = value;
      }
    }
  }

  if (legacyValues) {
    for (const [loc, value] of Object.entries(legacyValues)) {
      if (!result[loc] && value) {
        result[loc] = value;
      }
    }
  }

  return result;
}

export default function EditarArticuloForm({
  mode = 'edit',
  publication,
  articulo,
  userRole,
  lang: propLang,
  dict: propDict,
}: Props) {
  const pub = publication || articulo;
  if (mode === 'edit' && !pub) {
    throw new Error('EditarArticuloForm requires a publication prop');
  }

  const detectedLang = useLocale();
  const routeLang = propLang || detectedLang;
  const fallbackDict = getDictionaryClient(routeLang).articleEditor;
  const dict = propDict ? { ...fallbackDict, ...propDict } : fallbackDict;
  const [isPublishing, setIsPublishing] = useState(false);
  const [publicationId, setPublicationId] = useState<string | undefined>(pub?.id);
  const router = useRouter();
  const toast = useToast();
  const isCreate = mode === 'create';

  const initialData: ArticleData | undefined = pub
    ? {
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
      }
    : undefined;

  const handleSave = async (data: ArticleData, action: EditorAction): Promise<boolean> => {
    setIsPublishing(true);
    try {
      const resolvedId = publicationId || data.id;
      const result = await saveArticleAction(
        buildEditorSaveInput(data, {
          ...(resolvedId ? { id: resolvedId } : {}),
          action,
          lang: routeLang,
        })
      );

      if (!result.success) {
        toast.error(result.error || (isCreate ? dict.publishError : dict.saveError));
        return false;
      }

      const successMessage = isDraftAction(action)
        ? isCreate
          ? dict.draftSaved
          : dict.draftUpdated
        : isCreate
          ? dict.actionSuccessGeneric
          : dict.actionSuccess;

      toast.success(successMessage);

      router.push(`/${routeLang}/escritorio`);
      return true;
    } catch (error: unknown) {
      console.error('[EditarArticuloForm] Unexpected error on save:', error);
      toast.error(isCreate ? dict.unexpectedPublishError : dict.unexpectedError);
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ArticleEditor
      mode={mode}
      initialData={initialData}
      onSave={handleSave}
      onDraftCreated={({ id }) => setPublicationId(id)}
      isPublishing={isPublishing}
      userRole={userRole}
    />
  );
}
