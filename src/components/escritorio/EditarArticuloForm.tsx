"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import ArticleEditor, { ArticleData } from '@/components/escritorio/ArticleEditor';

interface Props {
  articulo: any;
}

export default function EditarArticuloForm({ articulo }: Props) {
    const [isPublishing, setIsPublishing] = useState(false);
    const router = useRouter();
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
        tipo: articulo.tipo || 'artigo'
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
                    tipo: data.tipo || 'artigo'
                })
                .eq('id', articulo.id);

            if (error) {
                console.error(error);
                alert('Error al guardar cambios: ' + error.message);
            } else {
                alert(isDraft ? '¡Borrador actualizado!' : '¡Artículo guardado y publicado!');
                router.push('/escritorio');
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
