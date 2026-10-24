import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EscritorioShell from '@/components/escritorio/EscritorioShell';

export default async function EscritorioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <EscritorioShell role={profile?.role || profile?.rol}>
      {children}
    </EscritorioShell>
  );
}
