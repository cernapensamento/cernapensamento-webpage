"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PUBLICATION_STATUSES } from '@/lib/db/schema';
import { updateArticleState } from '@/actions/articles';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface Props {
  articuloId: string;
}

export default function ReviewActionBar({ articuloId }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'gl';
  const dict = lang === 'es' ? esDict : glDict;

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      const newState = action === 'approve' ? PUBLICATION_STATUSES.PUBLISHED : PUBLICATION_STATUSES.DRAFT;
      const res = await updateArticleState(articuloId, newState);

      if (!res.success) {
        alert('Error: ' + res.error);
      } else {
        alert(action === 'approve' ? (dict.dashboard.approvedSuccess || '¡Artigo aprobado e publicado!') : (dict.dashboard.rejectedSuccess || 'Artigo rexeitado e devolto a borrador.'));
        router.push(`/${lang}/escritorio?filtro=para_aprobar`);
        router.refresh();
      }
    } catch (e: unknown) {
      alert('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-parchment/95 backdrop-blur-sm border-t border-lines p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
          <span className="font-sans text-xs uppercase tracking-widest font-bold text-charcoal">
            {dict.dashboard.reviewMode || 'Modo Revisión: Pendente de Aprobación'}
          </span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            disabled={isProcessing}
            onClick={() => handleAction('reject')}
            className="flex-1 sm:flex-none px-6 py-3 border border-charcoal text-charcoal font-sans text-xs uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-colors disabled:opacity-50"
          >
            {dict.articleEditor.reject || 'Rexeitar'}
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => handleAction('approve')}
            className="flex-1 sm:flex-none px-6 py-3 bg-gold text-parchment font-sans text-xs uppercase tracking-widest hover:bg-charcoal transition-colors disabled:opacity-50"
          >
            {dict.articleEditor.approveAndPublish || 'Aprobar e Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
