"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import ArticleEditor, { ArticleData } from '@/components/escritorio/ArticleEditor';

interface Props {
  articulo: any;
  userRole: string;
}

import { EditorAction } from '@/components/escritorio/ArticleEditor';
import { ARTICLE_STATES } from '@/lib/constants';
export default function EditarArticuloForm({ articulo, userRole }: Props) {
    const [isPublishing, setIsPublishing] = useState(false);
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'es';
    const supabase = createClient();

    const initialData: ArticleData = {
        id: String(articulo.id),
        titulo_gl: articulo.titulo_gl || '',
        titulo_es: articulo.titulo_es || '',
        subtitulo_gl: articulo.subtitulo_gl || '',
        subtitulo_es: articulo.subtitulo_es || '',
        contenido_gl: articulo.contenido_gl || '',
        contenido_es: articulo.contenido_es || '',
        imagen_url: articulo.imagen_url || '',
        tematicas: articulo.tematicas || [],
        estado: articulo.estado || ARTICLE_STATES.PUBLISHED,
        tipo: articulo.tipo || 'artigo',
        idioma_original: articulo.idioma_original || 'gl'
    };

    const handleSave = async (data: ArticleData, action: EditorAction) => {
        setIsPublishing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Debes iniciar sesión para editar');
                return;
            }

            const { error } = await supabase
                .from('articulos')
                .update({
                    titulo_gl: data.titulo_gl || 'Sen Título',
                    titulo_es: data.titulo_es || 'Sin Título',
                    subtitulo_gl: data.subtitulo_gl || null,
                    subtitulo_es: data.subtitulo_es || null,
                    contenido_gl: data.contenido_gl || '',
                    contenido_es: data.contenido_es || '',
                    imagen_url: data.imagen_url || null,
                    tematicas: data.tematicas || [],
                    estado: action === 'draft' || action === 'reject' || action === 'revoke_approval' ? ARTICLE_STATES.DRAFT : (action === 'submit_approval' ? ARTICLE_STATES.PENDING : ARTICLE_STATES.PUBLISHED),
                    actualizado_en: new Date().toISOString(),
                    tipo: data.tipo || 'artigo',
                    idioma_original: data.idioma_original || 'gl'
                })
                .eq('id', articulo.id);

            if (error) {
                console.error(error);
                alert('Error al guardar cambios: ' + error.message);
            } else {
                // Sync article_tags
                if (data.tematicas) {
                    await supabase.from('article_tags').delete().eq('article_id', articulo.id);
                    if (data.tematicas.length > 0) {
                        const { data: tagIds } = await supabase.from('tags').select('id, slug').in('slug', data.tematicas);
                        if (tagIds && tagIds.length > 0) {
                            await supabase.from('article_tags').insert(
                                tagIds.map(t => ({ article_id: String(articulo.id), tag_id: t.id }))
                            );
                        }
                    }
                }
                alert(action === 'draft' || action === 'reject' || action === 'revoke_approval' ? '¡Borrador actualizado!' : '¡Acción realizada con éxito!');
                router.push(`/${lang}/escritorio`);
            }
        } catch (error) {
            console.error(error);
            alert('Error inesperado al guardar.');
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
        />
    );
}
