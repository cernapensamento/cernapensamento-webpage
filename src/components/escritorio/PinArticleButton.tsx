'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  countPinnedPublications,
  setPublicationPinned,
  formatDbError,
} from '@/lib/db';
import { useToast } from '@/components/ui/FeedbackProvider';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

interface Props {
  id: string;
  isPinned?: boolean;
  fijado?: boolean;
}

const MAX_PINNED_PUBLICATIONS = 8;

export default function PinArticleButton({ id, isPinned, fijado }: Props) {
  const currentPinned = isPinned ?? fijado ?? false;
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();
  const lang = useLocale();
  const dashDict = getDictionaryClient(lang).dashboard;
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (!currentPinned) {
        const { count, error: countError } = await countPinnedPublications(supabase);
        if (countError) throw countError;

        if (count >= MAX_PINNED_PUBLICATIONS) {
          toast.warning(dashDict.pinLimitReached);
          return;
        }
      }

      const { success, error } = await setPublicationPinned(id, !currentPinned, supabase);
      if (!success || error) {
        const errMsg = error ? formatDbError(error) : '';
        toast.error(errMsg ? `${dashDict.pinError}: ${errMsg}` : dashDict.pinError);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(dashDict.pinError);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isToggling}
      className={`flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 ${currentPinned ? 'text-gold hover:text-charcoal/60' : 'text-charcoal/60 hover:text-gold'}`}
      title={currentPinned ? dashDict.unpinArticle : dashDict.pinArticle}
    >
      <span className="material-symbols-outlined text-sm" data-icon="push_pin">push_pin</span>
      <span className="font-sans text-xs">
        {isToggling ? dashDict.saving : currentPinned ? dashDict.unpin : dashDict.pin}
      </span>
    </button>
  );
}
