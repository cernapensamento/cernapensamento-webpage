"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import ArticleEditor, { ArticleData } from '@/components/escritorio/ArticleEditor';

export default function NuevoArticulo() {
    const [isPublishing, setIsPublishing] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 8);
    };

    const handleSave = async (data: ArticleData, isDraft: boolean) => {
        setIsPublishing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Debes iniciar sesión para publicar');
                return;
            }

            const slug = generateSlug(data.titulo_gl || data.titulo_es || 'novo-artigo');

            const { error } = await supabase.from('articulos').insert({
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
                estado: isDraft ? 'borrador' : 'publicado',
                tipo: data.tipo || 'artigo'
            }).select().single();

            if (error) {
                console.error(error);
                alert('Error al publicar: ' + error.message);
            } else {
                alert(isDraft ? '¡Borrador guardado con éxito!' : '¡Artículo publicado con éxito!');
                router.push('/escritorio');
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
        />
    );
}
