import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EscritorioShell from '@/components/escritorio/EscritorioShell';
import { resolveLocale } from '@/i18n-config';

export default async function EscritorioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const [{ user, profile, role }, resolvedParams] = await Promise.all([
    getAuthenticatedUser(),
    params,
  ]);
  const lang = resolveLocale(resolvedParams?.lang);

  if (!user) {
    redirect(`/${lang}/login`);
  }

  return (
    <EscritorioShell role={profile?.role || role}>
      {children}
    </EscritorioShell>
  );
}
