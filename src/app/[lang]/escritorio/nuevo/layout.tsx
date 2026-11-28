import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolveLocale } from '@/i18n-config';
import {
  PERMISSIONS,
  getGuestPublicationQuota,
  hasPermission,
  isGuestQuotaSubject,
} from '@/lib/db';
import { DESK_ERRORS } from '@/lib/db/schema';

export default async function NuevoArticuloLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
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

  if (isGuestQuotaSubject(permissions)) {
    const quota = await getGuestPublicationQuota(user.id);
    if (!quota.canCreate) {
      redirect(`/${lang}/escritorio?error=${DESK_ERRORS.LIMIT_REACHED}`);
    }
  }

  return <>{children}</>;
}
