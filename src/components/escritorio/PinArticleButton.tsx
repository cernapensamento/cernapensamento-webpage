'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Props {
    id: string;
    fijado: boolean;
}

export default function PinArticleButton({ id, fijado }: Props) {
    const [isToggling, setIsToggling] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleToggle = async () => {
        setIsToggling(true);
        try {
            if (!fijado) {
                const { count, error: countError } = await supabase
                    .from('articulos')
                    .select('*', { count: 'exact', head: true })
                    .eq('fijado', true);
                
                if (countError) throw countError;

                if (count !== null && count >= 8) {
                    alert('Deben retirarse artículos del tablón para liberar espacio (límite máximo de 8).');
                    setIsToggling(false);
                    return;
                }
            }

            const { error } = await supabase.from('articulos').update({ fijado: !fijado }).eq('id', id);
            if (error) {
                alert('Error al fijar/desfijar: ' + error.message);
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            alert('Error inesperado al verificar o actualizar.');
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <button type="button" 
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 ${fijado ? 'text-gold hover:text-charcoal/60' : 'text-charcoal/60 hover:text-gold'}`}
            title={fijado ? "Desfijar de la portada" : "Fijar en portada"}
        >
            <span className="material-symbols-outlined text-sm" data-icon="push_pin">push_pin</span>
            <span className="font-sans text-xs">{isToggling ? 'Cambiando...' : (fijado ? 'Desfijar' : 'Fijar')}</span>
        </button>
    );
}
