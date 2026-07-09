import React from 'react';
import { getAuthenticatedUser } from '@/utils/auth';
import { redirect } from 'next/navigation';

export default async function NuevoArticuloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  if (profile?.rol === 'usuario') {
    redirect('/escritorio/perfil');
  }

  return <>{children}</>;
}
