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
        titulo: articulo.titulo || '',
        subtitulo: articulo.subtitulo || '',
        contenido: articulo.contenido || '',
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

            const finalTitle = data.titulo || 'Sin Título';

            const { error } = await supabase
                .from('articulos')
                .update({
                    titulo: finalTitle,
                    subtitulo: data.subtitulo || null,
                    contenido: data.contenido,
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
