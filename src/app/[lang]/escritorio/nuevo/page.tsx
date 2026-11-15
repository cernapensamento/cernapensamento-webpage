"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import ArticleEditor, { ArticleData, EditorAction } from '@/components/escritorio/ArticleEditor';
import { buildEditorSaveInput } from '@/components/forms/EditarArticuloForm';
import { useToast } from '@/components/ui/FeedbackProvider';
import { getDictionaryClient } from '@/dictionaries/client';
import { useLocale } from '@/hooks/useLocale';
import { fetchClientAuthProfile } from '@/lib/auth-client';
import { USER_ROLES, isDraftAction, isReaderRole } from '@/lib/db/schema';
import { saveArticleAction } from '@/actions/articles';

export default function NuevoArticulo() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [userRole, setUserRole] = useState<string>(USER_ROLES.READER);
  const router = useRouter();
  const lang = useLocale();
  const dict = getDictionaryClient(lang);
  const edDict = dict.articleEditor;
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    async function fetchRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${lang}/login`);
        return;
      }
      const profile = await fetchClientAuthProfile(user.id, supabase);
      const role = profile?.role;
      if (!role || isReaderRole(role)) {
        router.push(`/${lang}/escritorio/perfil`);
        return;
      }
      setUserRole(role);
    }
    fetchRole();
  }, [supabase, router, lang]);

  const handleSave = async (data: ArticleData, action: EditorAction): Promise<boolean> => {
    setIsPublishing(true);
    try {
      const result = await saveArticleAction(
        buildEditorSaveInput(data, {
          action,
          lang,
        })
      );

      if (!result.success) {
        toast.error(result.error || edDict.publishError);
        return false;
      }

      toast.success(
        isDraftAction(action) ? edDict.draftSaved : edDict.actionSuccessGeneric
      );
      router.push(`/${lang}/escritorio`);
      return true;
    } catch (error: unknown) {
      console.error('[NuevoArticulo] Unexpected error on save:', error);
      toast.error(edDict.unexpectedPublishError);
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ArticleEditor
      mode="create"
      onSave={handleSave}
      isPublishing={isPublishing}
      userRole={userRole}
    />
  );
}
