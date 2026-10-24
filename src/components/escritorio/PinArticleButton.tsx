'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { DB_TABLES, PUBLICATION_COLS } from '@/lib/db/schema';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface Props {
    id: string;
    isPinned?: boolean;
    fijado?: boolean;
}

export default function PinArticleButton({ id, isPinned, fijado }: Props) {
    const currentPinned = isPinned ?? fijado ?? false;
    const [isToggling, setIsToggling] = useState(false);
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'gl';
    const dict = lang === 'es' ? esDict : glDict;
    const dashDict = dict.dashboard;
    const supabase = createClient();

    const handleToggle = async () => {
        setIsToggling(true);
        try {
            if (!currentPinned) {
                const { count, error: countError } = await supabase
                    .from(DB_TABLES.PUBLICATIONS)
                    .select('*', { count: 'exact', head: true })
                    .eq(PUBLICATION_COLS.IS_PINNED, true);
                
                if (countError) throw countError;

                if (count !== null && count >= 8) {
                    alert(dashDict.pinLimitReached || 'Deben retirarse publicacións do taboleiro para liberar espazo (límite máximo de 8).');
                    setIsToggling(false);
                    return;
                }
            }

            const { error } = await supabase
                .from(DB_TABLES.PUBLICATIONS)
                .update({ [PUBLICATION_COLS.IS_PINNED]: !currentPinned })
                .eq(PUBLICATION_COLS.ID, id);

            if (error) {
                alert((dashDict.pinError || 'Erro ao fixar/desfixar') + ': ' + error.message);
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            alert(dashDict.pinError || 'Erro ao fixar/desfixar');
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <button type="button" 
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 ${currentPinned ? 'text-gold hover:text-charcoal/60' : 'text-charcoal/60 hover:text-gold'}`}
            title={currentPinned ? dashDict.unpinArticle : dashDict.pinArticle}
        >
            <span className="material-symbols-outlined text-sm" data-icon="push_pin">push_pin</span>
            <span className="font-sans text-xs">{isToggling ? (dashDict.saving || 'Cambiando...') : (currentPinned ? dashDict.unpin : dashDict.pin)}</span>
        </button>
    );
}
