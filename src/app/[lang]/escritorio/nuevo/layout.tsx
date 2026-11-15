import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolveLocale } from '@/i18n-config';
import {
  canAccessWriterDesk,
  getGuestPublicationQuota,
  isGuestRole,
} from '@/lib/db';

export default async function NuevoArticuloLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const [resolvedParams, { user, profile, role }] = await Promise.all([
    params,
    getAuthenticatedUser(),
  ]);
  const lang = resolveLocale(resolvedParams?.lang);

  if (!user) {
    redirect(`/${lang}/login`);
  }

  const userRole = profile?.role || role;
  if (!canAccessWriterDesk(userRole)) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  if (isGuestRole(userRole)) {
    const quota = await getGuestPublicationQuota(user.id);
    if (!quota.canCreate) {
      redirect(`/${lang}/escritorio?error=limite_alcanzado`);
    }
  }

  return <>{children}</>;
}
