"use client";

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import ArticleEditor, {
  ArticleData,
  EditorAction,
} from '@/components/escritorio/ArticleEditor';
import {
  DB_TABLES,
  PUBLICATION_COLS,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  PUBLICATION_TAG_COLS,
  TAG_COLS,
  type PublicationTypeValue,
  type PublicationStatusValue,
} from '@/lib/db/schema';
import type { PublicationDetail } from '@/lib/db/types';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface Props {
  publication?: PublicationDetail;
  articulo?: PublicationDetail;
  userRole: string;
}

function normalizePublicationType(type?: string): PublicationTypeValue {
  switch (type) {
    case 'ensaio':
    case 'ensayo':
    case PUBLICATION_TYPES.ESSAY:
      return PUBLICATION_TYPES.ESSAY;
    case 'reportaxe':
    case 'reportaje':
    case PUBLICATION_TYPES.REPORTAGE:
      return PUBLICATION_TYPES.REPORTAGE;
    case 'columna':
    case PUBLICATION_TYPES.COLUMN:
      return PUBLICATION_TYPES.COLUMN;
    case 'entrevista':
    case PUBLICATION_TYPES.INTERVIEW:
      return PUBLICATION_TYPES.INTERVIEW;
    case 'poesia':
    case 'poesía':
    case PUBLICATION_TYPES.POETRY:
      return PUBLICATION_TYPES.POETRY;
    case 'noticia':
    case PUBLICATION_TYPES.NEWS:
      return PUBLICATION_TYPES.NEWS;
    case 'artigo':
    case 'articulo':
    case PUBLICATION_TYPES.ARTICLE:
    default:
      return PUBLICATION_TYPES.ARTICLE;
  }
}

export default function EditarArticuloForm({
  publication,
  articulo,
  userRole,
}: Props) {
  const pub = (publication || articulo)!;
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'gl';
  const dict = lang === 'es' ? esDict : glDict;
  const supabase = createClient();

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
    // Backwards-compatible aliases
    titulo_gl: pub.title?.gl || '',
    titulo_es: pub.title?.es || '',
    subtitulo_gl: pub.subtitle?.gl || '',
    subtitulo_es: pub.subtitle?.es || '',
    contenido_gl: pub.content?.gl || '',
    contenido_es: pub.content?.es || '',
    imagen_url: pub.cover_image_url || '',
    tematicas: pub.tags?.map((t) => t.slug) || [],
    estado: pub.status,
    tipo: pub.type,
    idioma_original: pub.original_language,
  };

  const handleSave = async (data: ArticleData, action: EditorAction) => {
    setIsPublishing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Debes iniciar sesión para editar');
        return;
      }

      let updatedSlug = pub.slug;
      const titleGl = data.title?.gl || data.titulo_gl || '';
      const titleEs = data.title?.es || data.titulo_es || '';
      const currentTitle = titleGl || titleEs;
      const isPlaceholderSlug =
        !pub.slug ||
        pub.slug.startsWith('novo-artigo') ||
        pub.slug.startsWith('sin-titulo') ||
        pub.slug.startsWith('sen-titulo');
      const isDraft =
        pub.status === PUBLICATION_STATUSES.DRAFT ||
        (pub as unknown as { estado?: string }).estado === 'borrador';

      if (currentTitle && (isPlaceholderSlug || isDraft)) {
        const match = pub.slug?.match(/-([a-z0-9]{6})$/i);
        const suffix = match
          ? match[1]
          : Math.random().toString(36).substring(2, 8);
        const base = currentTitle
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (base) {
          updatedSlug = `${base}-${suffix}`;
        }
      }

      const subtitleGl = data.subtitle?.gl || data.subtitulo_gl || null;
      const subtitleEs = data.subtitle?.es || data.subtitulo_es || null;
      const contentGl = data.content?.gl || data.contenido_gl || '';
      const contentEs = data.content?.es || data.contenido_es || '';

      let targetStatus: PublicationStatusValue = PUBLICATION_STATUSES.PUBLISHED;
      if (
        action === PUBLICATION_STATUSES.DRAFT ||
        action === 'reject' ||
        action === 'revoke_approval'
      ) {
        targetStatus = PUBLICATION_STATUSES.DRAFT;
      } else if (action === 'submit_approval') {
        targetStatus = PUBLICATION_STATUSES.IN_REVIEW;
      }

      const updatePayload = {
        [PUBLICATION_COLS.TITLE]: {
          gl: titleGl || 'Sen Título',
          es: titleEs || 'Sin Título',
        },
        [PUBLICATION_COLS.SUBTITLE]:
          subtitleGl || subtitleEs
            ? { gl: subtitleGl || '', es: subtitleEs || '' }
            : null,
        [PUBLICATION_COLS.SLUG]: updatedSlug,
        [PUBLICATION_COLS.CONTENT]: { gl: contentGl, es: contentEs },
        [PUBLICATION_COLS.COVER_IMAGE_URL]:
          data.cover_image_url || data.imagen_url || null,
        [PUBLICATION_COLS.STATUS]: targetStatus,
        [PUBLICATION_COLS.UPDATED_AT]: new Date().toISOString(),
        [PUBLICATION_COLS.TYPE]: normalizePublicationType(
          data.type || data.tipo
        ),
        [PUBLICATION_COLS.ORIGINAL_LANGUAGE]:
          data.original_language || data.idioma_original || 'gl',
      };

      const { error } = await supabase
        .from(DB_TABLES.PUBLICATIONS)
        .update(updatePayload)
        .eq(PUBLICATION_COLS.ID, pub.id);

      if (error) {
        console.error(error);
        alert('Error al guardar cambios: ' + error.message);
      } else {
        // Sync publication tags
        const tagSlugs = data.tags || data.tematicas;
        if (tagSlugs) {
          await supabase
            .from(DB_TABLES.PUBLICATION_TAGS)
            .delete()
            .eq(PUBLICATION_TAG_COLS.PUBLICATION_ID, pub.id);

          if (tagSlugs.length > 0) {
            const { data: tagRows } = await supabase
              .from(DB_TABLES.TAGS)
              .select(TAG_COLS.ID)
              .in(TAG_COLS.SLUG, tagSlugs);

            if (tagRows && tagRows.length > 0) {
              await supabase.from(DB_TABLES.PUBLICATION_TAGS).insert(
                tagRows.map((t) => ({
                  [PUBLICATION_TAG_COLS.PUBLICATION_ID]: pub.id,
                  [PUBLICATION_TAG_COLS.TAG_ID]: t.id,
                }))
              );
            }
          }
        }

        alert(
          action === PUBLICATION_STATUSES.DRAFT ||
            action === 'reject' ||
            action === 'revoke_approval'
            ? dict.articleEditor.draftUpdated
            : dict.articleEditor.actionSuccess
        );
        router.push(`/${lang}/escritorio`);
      }
    } catch (error: unknown) {
      console.error(error);
      alert(dict.articleEditor.unexpectedError);
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
