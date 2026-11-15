"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArticleEditor, {
  ArticleData,
  EditorAction,
} from '@/components/escritorio/ArticleEditor';
import type { LocalizedString, PublicationDetail } from '@/lib/db/types';
import { useToast } from '@/components/ui/FeedbackProvider';
import { saveArticleAction } from '@/actions/articles';
import { isDraftAction } from '@/lib/db/schema';
import { getDictionaryClient, type Dictionary } from '@/dictionaries/client';
import { i18n } from '@/i18n-config';
import { useLocale } from '@/hooks/useLocale';

type ArticleEditorDict = Partial<Dictionary['articleEditor']>;

interface Props {
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
  publication,
  articulo,
  userRole,
  lang: propLang,
  dict: propDict,
}: Props) {
  const pub = publication || articulo;
  if (!pub) {
    throw new Error('EditarArticuloForm requires a publication prop');
  }

  const detectedLang = useLocale();
  const routeLang = propLang || detectedLang;
  const fallbackDict = getDictionaryClient(routeLang).articleEditor;
  const dict = propDict ? { ...fallbackDict, ...propDict } : fallbackDict;
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
      const title = buildLocalizedField(data.title, {
        gl: data.titulo_gl,
        es: data.titulo_es,
      });
      const candidateSubtitle = buildLocalizedField(data.subtitle, {
        gl: data.subtitulo_gl,
        es: data.subtitulo_es,
      });
      const hasSubtitle = Object.values(candidateSubtitle).some(
        (v) => typeof v === 'string' && v.trim().length > 0
      );
      const content = buildLocalizedField(data.content, {
        gl: data.contenido_gl,
        es: data.contenido_es,
      });

      const result = await saveArticleAction({
        id: pub.id,
        title,
        subtitle: hasSubtitle ? candidateSubtitle : null,
        content,
        cover_image_url: data.cover_image_url || data.imagen_url || null,
        tags: data.tags || data.tematicas || [],
        type: data.type || data.tipo,
        original_language:
          data.original_language || data.idioma_original || i18n.defaultLocale,
        show_index: Boolean(data.show_index),
        action,
        lang: routeLang,
      });

      if (!result.success) {
        toast.error(result.error || dict.saveError);
        return false;
      }

      toast.success(isDraftAction(action) ? dict.draftUpdated : dict.actionSuccess);

      router.push(`/${routeLang}/escritorio`);
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
