'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { DB_TABLES, PUBLICATION_COLS } from '@/lib/db/schema';
import { cleanupPublicationImages } from '@/lib/storage';
import { useConfirm, useToast } from '@/components/ui/FeedbackProvider';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface Props {
    id: string;
    titulo: string;
}

export default function DeleteArticleButton({ id, titulo }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'gl';
    const dict = lang === 'es' ? esDict : glDict;
    const dashDict = dict.dashboard;
    const supabase = createClient();
    const confirm = useConfirm();
    const toast = useToast();

    const handleDelete = async () => {
        const confirmMsg = dashDict.deleteConfirm.replace('{title}', titulo);
        const ok = await confirm({
            title: dashDict.deleteArticle,
            description: confirmMsg,
            confirmLabel: dashDict.delete,
            cancelLabel: dict.common.cancel,
            variant: 'danger',
        });
        if (!ok) {
            return;
        }

        setIsDeleting(true);
        try {
            // Retrieve image assets before deleting publication to avoid orphaned files in storage
            const { data: pubData } = await supabase
                .from(DB_TABLES.PUBLICATIONS)
                .select(`${PUBLICATION_COLS.COVER_IMAGE_URL}, ${PUBLICATION_COLS.CONTENT}`)
                .eq(PUBLICATION_COLS.ID, id)
                .single();

            const { error } = await supabase
                .from(DB_TABLES.PUBLICATIONS)
                .delete()
                .eq(PUBLICATION_COLS.ID, id);

            if (error) {
                toast.error(dashDict.deleteError + ': ' + error.message);
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
            toast.error(dashDict.deleteError);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button type="button" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1 text-charcoal/60 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
            title={dashDict.deleteArticle || 'Eliminar artigo'}
        >
            <span className="material-symbols-outlined text-sm" data-icon="delete">delete</span>
            <span className="font-sans text-xs">{isDeleting ? (dashDict.deleting || 'Eliminando...') : (dashDict.delete || 'Eliminar')}</span>
        </button>
    );
}
