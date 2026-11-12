"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArticleEditor, {
  ArticleData,
  EditorAction,
} from '@/components/escritorio/ArticleEditor';
import type { PublicationDetail } from '@/lib/db/types';
import { useToast } from '@/components/ui/FeedbackProvider';
import { saveArticleAction } from '@/actions/articles';
import { isDraftAction } from '@/lib/db/schema';
import { getDictionaryClient } from '@/dictionaries/client';
import type { Locale } from '@/i18n-config';

type ArticleEditorDict = ReturnType<typeof getDictionaryClient>['articleEditor'];

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
  lang = 'gl',
  dict: propDict,
}: Props) {
  const pub = publication || articulo;
  if (!pub) {
    throw new Error('EditarArticuloForm requires a publication prop');
  }

  const locale = (lang === 'es' ? 'es' : 'gl') as Locale;
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
    published_at: pub.published_at,
  };

  const handleSave = async (data: ArticleData, action: EditorAction): Promise<boolean> => {
    setIsPublishing(true);
    try {
      const result = await saveArticleAction({
        id: pub.id,
        title: {
          gl: data.title?.gl || data.titulo_gl || '',
          es: data.title?.es || data.titulo_es || '',
        },
        subtitle:
          data.subtitle?.gl || data.subtitle?.es || data.subtitulo_gl || data.subtitulo_es
            ? {
                gl: data.subtitle?.gl || data.subtitulo_gl || '',
                es: data.subtitle?.es || data.subtitulo_es || '',
              }
            : null,
        content: {
          gl: data.content?.gl || data.contenido_gl || '',
          es: data.content?.es || data.contenido_es || '',
        },
        cover_image_url: data.cover_image_url || data.imagen_url || null,
        tags: data.tags || data.tematicas || [],
        type: data.type || data.tipo,
        original_language: data.original_language || data.idioma_original || 'gl',
        action,
        lang,
      });

      if (!result.success) {
        toast.error(result.error || dict.saveError);
        return false;
      }

      toast.success(isDraftAction(action) ? dict.draftUpdated : dict.actionSuccess);

      router.push(`/${lang}/escritorio`);
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
