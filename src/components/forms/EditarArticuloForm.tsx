"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import ArticleEditor, { ArticleData } from '@/components/escritorio/ArticleEditor';

interface Props {
  articulo: { id?: string | number; titulo_gl?: string; titulo_es?: string; subtitulo_gl?: string; subtitulo_es?: string; contenido_gl?: string; contenido_es?: string; imagen_url?: string; tematicas?: string[]; estado?: string; tipo?: string; fijado?: boolean; idioma_original?: string; };
}

export default function EditarArticuloForm({ articulo }: Props) {
    const [isPublishing, setIsPublishing] = useState(false);
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'es';
    const supabase = createClient();

    const initialData: ArticleData = {
        id: articulo.id,
        titulo_gl: articulo.titulo_gl || '',
        titulo_es: articulo.titulo_es || '',
        subtitulo_gl: articulo.subtitulo_gl || '',
        subtitulo_es: articulo.subtitulo_es || '',
        contenido_gl: articulo.contenido_gl || '',
        contenido_es: articulo.contenido_es || '',
        imagen_url: articulo.imagen_url || '',
        tematicas: articulo.tematicas || [],
        estado: articulo.estado || 'publicado',
        tipo: articulo.tipo || 'artigo',
        idioma_original: articulo.idioma_original || 'gl'
    };

    const handleSave = async (data: ArticleData, isDraft: boolean) => {
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
                    estado: isDraft ? 'borrador' : 'publicado',
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
                                tagIds.map(t => ({ article_id: articulo.id, tag_id: t.id }))
                            );
                        }
                    }
                }
                alert(isDraft ? '¡Borrador actualizado!' : '¡Artículo guardado y publicado!');
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
