'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { DB_TABLES, PUBLICATION_COLS } from '@/lib/db/schema';
import { cleanupPublicationImages } from '@/lib/storage';

interface Props {
    id: string;
    titulo: string;
}

export default function DeleteArticleButton({ id, titulo }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleDelete = async () => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar "${titulo}" por completo? Esta acción no se puede deshacer.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            // Retrieve image assets before deleting publication to avoid orphaned files in storage
            const { data: pubData } = await supabase
                .from(DB_TABLES.PUBLICATIONS)
                .select('cover_image_url, content')
                .eq(PUBLICATION_COLS.ID, id)
                .single();

            const { error } = await supabase
                .from(DB_TABLES.PUBLICATIONS)
                .delete()
                .eq(PUBLICATION_COLS.ID, id);

            if (error) {
                alert('Error al eliminar: ' + error.message);
            } else {
                if (pubData) {
                    const content = pubData.content as { gl?: string; es?: string } | null;
                    cleanupPublicationImages(supabase, {
                        coverUrl: pubData.cover_image_url,
                        contentGl: content?.gl,
                        contentEs: content?.es,
                    }).catch(console.error);
                }
                router.refresh(); // Refresh the page to reflect the deletion
            }
        } catch (error) {
            console.error(error);
            alert('Error inesperado al eliminar.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button type="button" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1 text-charcoal/60 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
            title="Eliminar artículo"
        >
            <span className="material-symbols-outlined text-sm" data-icon="delete">delete</span>
            <span className="font-sans text-xs">{isDeleting ? 'Eliminando...' : 'Eliminar'}</span>
        </button>
    );
}
