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
        contenido: articulo.contenido || '',
        imagen_url: articulo.imagen_url || '',
        estado: articulo.estado || 'publicado'
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
                    contenido: data.contenido,
                    imagen_url: data.imagen_url || null,
                    estado: isDraft ? 'borrador' : 'publicado',
                    actualizado_en: new Date().toISOString()
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
