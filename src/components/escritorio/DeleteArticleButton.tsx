'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { DB_TABLES, PUBLICATION_COLS } from '@/lib/db/schema';

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
            const { error } = await supabase
                .from(DB_TABLES.PUBLICATIONS)
                .delete()
                .eq(PUBLICATION_COLS.ID, id);
            if (error) {
                alert('Error al eliminar: ' + error.message);
            } else {
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
