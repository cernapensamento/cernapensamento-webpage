import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';
import { PERMISSIONS, hasPermission } from '@/lib/db';
import EditarArticuloForm from '@/components/forms/EditarArticuloForm';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function NuevoArticuloPage({ params }: Props) {
  const [resolvedParams, { user, permissions }] = await Promise.all([
    params,
    getAuthenticatedUser(),
  ]);
  const lang = resolveLocale(resolvedParams?.lang);

  if (!user) {
    redirect(`/${lang}/login`);
  }

  if (!hasPermission(permissions, PERMISSIONS.DESK_ACCESS)) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  if (!hasPermission(permissions, PERMISSIONS.PUBLICATIONS_CREATE)) {
    redirect(`/${lang}/escritorio`);
  }

  const dict = await getDictionary(lang);

  return (
    <EditarArticuloForm
      mode="create"
      permissions={permissions}
      lang={lang}
      dict={dict.articleEditor}
    />
  );
}
