'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getPublicationAssetsForCleanup,
  deletePublication,
  formatDbError,
} from '@/lib/db';
import { cleanupPublicationImages } from '@/lib/storage';
import { useConfirm, useToast } from '@/components/ui/FeedbackProvider';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

interface Props {
  id: string;
  titulo: string;
}

export default function DeleteArticleButton({ id, titulo }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const lang = useLocale();
  const dict = getDictionaryClient(lang);
  const dashDict = dict.dashboard;
  const supabase = useMemo(() => createClient(), []);
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
      const pubData = await getPublicationAssetsForCleanup(id, supabase);
      const { success, error } = await deletePublication(id, supabase);

      if (!success) {
        const errMsg = error ? formatDbError(error) : '';
        toast.error(errMsg ? `${dashDict.deleteError}: ${errMsg}` : dashDict.deleteError);
        return;
      }

      if (pubData) {
        cleanupPublicationImages(supabase, {
          coverUrl: pubData.cover_image_url,
          content: pubData.content,
        }).catch(console.error);
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(dashDict.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-1 text-charcoal/60 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
      title={dashDict.deleteArticle}
    >
      <span className="material-symbols-outlined text-sm" data-icon="delete">delete</span>
      <span className="font-sans text-xs">{isDeleting ? dashDict.deleting : dashDict.delete}</span>
    </button>
  );
}
