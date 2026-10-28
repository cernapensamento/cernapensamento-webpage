import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EscritorioShell from '@/components/escritorio/EscritorioShell';

export default async function EscritorioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const [{ user, profile }, resolvedParams] = await Promise.all([
    getAuthenticatedUser(),
    params,
  ]);
  const lang = resolvedParams?.lang || 'gl';

  if (!user) {
    redirect(`/${lang}/login`);
  }

  return (
    <EscritorioShell role={profile?.role || profile?.rol}>
      {children}
    </EscritorioShell>
  );
}
