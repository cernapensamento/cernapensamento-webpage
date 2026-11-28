"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PUBLICATION_STATUSES,
  EDITOR_ACTIONS,
  PERMISSIONS,
  hasPermission,
} from '@/lib/db/schema';
import { updateArticleState } from '@/actions/articles';
import { useToast } from '@/components/ui/FeedbackProvider';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

interface Props {
  articuloId: string;
  status?: string;
}

type ReviewAction = typeof EDITOR_ACTIONS.APPROVE | typeof EDITOR_ACTIONS.REJECT;

export default function ReviewActionBar({ articuloId, status }: Props) {
  const { profile, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const lang = useLocale();
  const dict = getDictionaryClient(lang);
  const toast = useToast();

  if (status && status !== PUBLICATION_STATUSES.IN_REVIEW) {
    return null;
  }

  if (loading || !hasPermission(profile?.permissions, PERMISSIONS.PUBLICATIONS_REVIEW)) {
    return null;
  }

  const handleAction = async (action: ReviewAction) => {
    setIsProcessing(true);
    try {
      const newState =
        action === EDITOR_ACTIONS.APPROVE
          ? PUBLICATION_STATUSES.PUBLISHED
          : PUBLICATION_STATUSES.DRAFT;
      const res = await updateArticleState(articuloId, newState, lang);

      if (!res.success) {
        toast.error(`${dict.feedback.error}: ${res.error || dict.dashboard.unknownError}`);
      } else {
        toast.success(
          action === EDITOR_ACTIONS.APPROVE
            ? dict.dashboard.approvedSuccess
            : dict.dashboard.rejectedSuccess
        );
        router.push(`/${lang}/escritorio?filtro=para_aprobar`);
        router.refresh();
      }
    } catch (e: unknown) {
      toast.error(
        `${dict.feedback.error}: ${e instanceof Error ? e.message : String(e)}`
      );
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
            {dict.dashboard.reviewMode}
          </span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleAction(EDITOR_ACTIONS.REJECT)}
            className="flex-1 sm:flex-none px-6 py-3 border border-charcoal text-charcoal font-sans text-xs uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-colors disabled:opacity-50"
          >
            {dict.articleEditor.reject}
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleAction(EDITOR_ACTIONS.APPROVE)}
            className="flex-1 sm:flex-none px-6 py-3 bg-gold text-parchment font-sans text-xs uppercase tracking-widest hover:bg-charcoal transition-colors disabled:opacity-50"
          >
            {dict.articleEditor.approveAndPublish}
          </button>
        </div>
      </div>
    </div>
  );
}
