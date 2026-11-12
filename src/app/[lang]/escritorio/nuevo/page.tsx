"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import ArticleEditor, { ArticleData, EditorAction } from '@/components/escritorio/ArticleEditor';
import { useToast } from '@/components/ui/FeedbackProvider';
import { getDictionaryClient } from '@/dictionaries/client';
import type { Locale } from '@/i18n-config';
import { DB_TABLES, USER_COLS, USER_ROLES, isDraftAction } from '@/lib/db/schema';
import { saveArticleAction } from '@/actions/articles';

export default function NuevoArticulo() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [userRole, setUserRole] = useState<string>(USER_ROLES.READER);
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as Locale) || 'gl';
  const dict = getDictionaryClient(lang);
  const edDict = dict.articleEditor;
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    async function fetchRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${lang}/login`);
        return;
      }
      const { data } = await supabase
        .from(DB_TABLES.USERS)
        .select(USER_COLS.ROLE)
        .eq(USER_COLS.ID, user.id)
        .single();
      const role = data?.role;
      if (!role || role === 'reader') {
        router.push(`/${lang}/escritorio/perfil`);
        return;
      }
      setUserRole(role);
    }
    fetchRole();
  }, [supabase, router, lang]);

  const handleSave = async (data: ArticleData, action: EditorAction): Promise<boolean> => {
    setIsPublishing(true);
    try {
      const result = await saveArticleAction({
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
        toast.error(result.error || edDict.publishError);
        return false;
      }

      toast.success(
        isDraftAction(action) ? edDict.draftSaved : edDict.actionSuccessGeneric
      );
      router.push(`/${lang}/escritorio`);
      return true;
    } catch (error: unknown) {
      console.error('[NuevoArticulo] Unexpected error on save:', error);
      toast.error(edDict.unexpectedPublishError);
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ArticleEditor
      mode="create"
      onSave={handleSave}
      isPublishing={isPublishing}
      userRole={userRole}
    />
  );
}
