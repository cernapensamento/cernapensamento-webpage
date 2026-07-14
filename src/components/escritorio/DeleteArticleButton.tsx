'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

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
            const { error } = await supabase.from('articulos').delete().eq('id', id);
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
        <button 
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
