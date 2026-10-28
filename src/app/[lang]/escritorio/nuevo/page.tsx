"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import ArticleEditor, { ArticleData, EditorAction } from '@/components/escritorio/ArticleEditor';
import { useToast } from '@/components/ui/FeedbackProvider';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';
import {
  DB_TABLES,
  PUBLICATION_COLS,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  PUBLICATION_TAG_COLS,
  USER_COLS,
  TAG_COLS,
  type PublicationTypeValue,
  type PublicationStatusValue,
} from '@/lib/db/schema';

function normalizePublicationType(type?: string): PublicationTypeValue {
  switch (type) {
    case 'ensaio':
    case 'ensayo':
    case 'essay':
      return PUBLICATION_TYPES.ESSAY;
    case 'reportaxe':
    case 'reportaje':
    case 'reportage':
      return PUBLICATION_TYPES.REPORTAGE;
    case 'columna':
    case 'column':
      return PUBLICATION_TYPES.COLUMN;
    case 'entrevista':
    case 'interview':
      return PUBLICATION_TYPES.INTERVIEW;
    case 'poesia':
    case 'poesía':
    case 'poetry':
      return PUBLICATION_TYPES.POETRY;
    case 'noticia':
    case 'news':
      return PUBLICATION_TYPES.NEWS;
    case 'artigo':
    case 'articulo':
    case 'article':
    default:
      return PUBLICATION_TYPES.ARTICLE;
  }
}

const generateSlug = (title: string) => {
  return (
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 8)
  );
};

export default function NuevoArticulo() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [userRole, setUserRole] = useState<string>('reader');
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'es';
  const dict = lang === 'gl' ? glDict : esDict;
  const edDict = dict.articleEditor;
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    async function fetchRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from(DB_TABLES.USERS)
          .select(USER_COLS.ROLE)
          .eq(USER_COLS.ID, user.id)
          .single();
        if (data?.role) setUserRole(data.role);
      }
    }
    fetchRole();
  }, [supabase]);

  const handleSave = async (data: ArticleData, action: EditorAction): Promise<boolean> => {
    setIsPublishing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error(edDict.sessionRequiredPublish);
        return false;
      }

      const titleGl = data.title?.gl || data.titulo_gl || 'Sen Título';
      const titleEs = data.title?.es || data.titulo_es || 'Sin Título';
      const subtitleGl = data.subtitle?.gl || data.subtitulo_gl || null;
      const subtitleEs = data.subtitle?.es || data.subtitulo_es || null;
      const contentGl = data.content?.gl || data.contenido_gl || '';
      const contentEs = data.content?.es || data.contenido_es || '';

      const slug = generateSlug(titleGl || titleEs || 'novo-artigo');

      let targetStatus: PublicationStatusValue = PUBLICATION_STATUSES.DRAFT;
      if (action === 'publish' || action === 'approve') {
        targetStatus = PUBLICATION_STATUSES.PUBLISHED;
      } else if (action === 'submit_approval') {
        targetStatus = PUBLICATION_STATUSES.IN_REVIEW;
      }

      const { data: insertedArticle, error } = await supabase
        .from(DB_TABLES.PUBLICATIONS)
        .insert({
          [PUBLICATION_COLS.TITLE]: { gl: titleGl, es: titleEs },
          [PUBLICATION_COLS.SUBTITLE]:
            subtitleGl || subtitleEs
              ? { gl: subtitleGl || '', es: subtitleEs || '' }
              : null,
          [PUBLICATION_COLS.SLUG]: slug,
          [PUBLICATION_COLS.CONTENT]: { gl: contentGl, es: contentEs },
          [PUBLICATION_COLS.AUTHOR_ID]: user.id,
          [PUBLICATION_COLS.COVER_IMAGE_URL]:
            data.cover_image_url || data.imagen_url || null,
          [PUBLICATION_COLS.STATUS]: targetStatus,
          [PUBLICATION_COLS.TYPE]: normalizePublicationType(
            data.type || data.tipo
          ),
          [PUBLICATION_COLS.ORIGINAL_LANGUAGE]:
            data.original_language || data.idioma_original || 'gl',
        })
        .select(PUBLICATION_COLS.ID)
        .single();

      if (error || !insertedArticle) {
        console.error(error);
        toast.error(edDict.publishError + error?.message);
        return false;
      }

      // Sync publication tags
      const tagSlugs = data.tags || data.tematicas || [];
      if (tagSlugs.length > 0) {
        const { data: tagRows } = await supabase
          .from(DB_TABLES.TAGS)
          .select(TAG_COLS.ID)
          .in(TAG_COLS.SLUG, tagSlugs);

        if (tagRows && tagRows.length > 0) {
          await supabase.from(DB_TABLES.PUBLICATION_TAGS).insert(
            tagRows.map((t) => ({
              [PUBLICATION_TAG_COLS.PUBLICATION_ID]: insertedArticle.id,
              [PUBLICATION_TAG_COLS.TAG_ID]: t.id,
            }))
          );
        }
      }

      toast.success(
        action === 'draft'
          ? edDict.draftSaved
          : edDict.actionSuccessGeneric
      );
      router.push(`/${lang}/escritorio`);
      return true;
    } catch (error: unknown) {
      console.error(error);
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
