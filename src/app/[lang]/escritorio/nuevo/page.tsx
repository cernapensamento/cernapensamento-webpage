import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';
import { PERMISSIONS, USER_ROLES, hasPermission } from '@/lib/db';
import EditarArticuloForm from '@/components/forms/EditarArticuloForm';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function NuevoArticuloPage({ params }: Props) {
  const [resolvedParams, { user, role, permissions }] = await Promise.all([
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
      userRole={role || USER_ROLES.READER}
      permissions={permissions}
      lang={lang}
      dict={dict.articleEditor}
    />
  );
}
