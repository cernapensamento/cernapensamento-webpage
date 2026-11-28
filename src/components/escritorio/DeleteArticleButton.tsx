'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteArticleAction } from '@/actions/articles';
import { PERMISSIONS, hasPermission, type PermissionValue } from '@/lib/db/schema';
import { useConfirm, useToast } from '@/components/ui/FeedbackProvider';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

interface Props {
  id: string;
  titulo: string;
  isPublished?: boolean;
  permissions?: readonly PermissionValue[];
}

export default function DeleteArticleButton({
  id,
  titulo,
  isPublished = false,
  permissions,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const lang = useLocale();
  const dict = getDictionaryClient(lang);
  const dashDict = dict.dashboard;
  const confirm = useConfirm();
  const toast = useToast();

  const effectivePermissions = permissions ?? [];
  const canDelete =
    hasPermission(effectivePermissions, PERMISSIONS.PUBLICATIONS_DELETE_ANY) ||
    (!isPublished && hasPermission(effectivePermissions, PERMISSIONS.PUBLICATIONS_DELETE_OWN));

  if (!canDelete) {
    return null;
  }

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
      const result = await deleteArticleAction(id, lang);

      if (!result.success) {
        toast.error(
          result.error ? `${dashDict.deleteError}: ${result.error}` : dashDict.deleteError
        );
        return;
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
