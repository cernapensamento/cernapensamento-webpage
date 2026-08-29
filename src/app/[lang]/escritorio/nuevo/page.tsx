"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import ArticleEditor, { ArticleData, EditorAction } from '@/components/escritorio/ArticleEditor';
import { ARTICLE_STATES } from '@/lib/constants';

const generateSlug = (title: string) => {
    return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 8);
};

export default function NuevoArticulo() {
    const [isPublishing, setIsPublishing] = useState(false);
    const [userRole, setUserRole] = useState<string>('usuario');
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'es';
    const supabase = createClient();

    useEffect(() => {
        async function fetchRole() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
                if (data?.rol) setUserRole(data.rol);
            }
        }
        fetchRole();
    }, [supabase]);

    const handleSave = async (data: ArticleData, action: EditorAction) => {
        setIsPublishing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Debes iniciar sesión para publicar');
                return;
            }

            const slug = generateSlug(data.titulo_gl || data.titulo_es || 'novo-artigo');

            let targetEstado: string = ARTICLE_STATES.DRAFT;
            if (action === 'publish' || action === 'approve') targetEstado = ARTICLE_STATES.PUBLISHED;
            else if (action === 'submit_approval') targetEstado = ARTICLE_STATES.PENDING;

            const { data: insertedArticle, error } = await supabase.from('articulos').insert({
                titulo_gl: data.titulo_gl || 'Sen Título',
                titulo_es: data.titulo_es || 'Sin Título',
                subtitulo_gl: data.subtitulo_gl || null,
                subtitulo_es: data.subtitulo_es || null,
                slug: slug,
                contenido_gl: data.contenido_gl || '',
                contenido_es: data.contenido_es || '',
                autor_id: user.id,
                imagen_url: data.imagen_url || null,
                tematicas: data.tematicas || [],
                estado: targetEstado,
                tipo: data.tipo || 'artigo',
                idioma_original: data.idioma_original || 'gl'
            }).select().single();

            if (error || !insertedArticle) {
                console.error(error);
                alert('Error al publicar: ' + error?.message);
            } else {
                // Sync article_tags
                if (data.tematicas && data.tematicas.length > 0) {
                    const { data: tagIds } = await supabase.from('tags').select('id, slug').in('slug', data.tematicas);
                    if (tagIds && tagIds.length > 0) {
                        await supabase.from('article_tags').insert(
                            tagIds.map(t => ({ article_id: insertedArticle.id, tag_id: t.id }))
                        );
                    }
                }
                alert(action === 'draft' ? '¡Borrador guardado con éxito!' : '¡Acción realizada con éxito!');
                router.push(`/${lang}/escritorio`);
            }
        } catch (error) {
            console.error(error);
            alert('Error inesperado al publicar.');
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
