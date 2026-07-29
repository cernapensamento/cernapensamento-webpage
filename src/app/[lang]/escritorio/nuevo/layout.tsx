import React from 'react';
import { getAuthenticatedUser } from '@/utils/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function NuevoArticuloLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const [resolvedParams, { user, profile }] = await Promise.all([
    params,
    getAuthenticatedUser()
  ]);
  const lang = resolvedParams.lang || 'es';

  if (!user) {
    redirect(`/${lang}/login`);
  }

  if (!['escritor', 'admin', 'invitado'].includes(profile?.rol)) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  if (profile?.rol === 'invitado') {
    const supabase = await createClient();
    const { data: articulos } = await supabase
      .from('articulos')
      .select('creado_en')
      .eq('autor_id', user.id);

    const todosLosArticulos = articulos || [];
    const currentYear = new Date().getFullYear();
    const articulosEsteAno = todosLosArticulos.filter(a => new Date(a.creado_en).getFullYear() === currentYear).length;
    
    if (todosLosArticulos.length >= 4 || articulosEsteAno >= 2) {
      redirect(`/${lang}/escritorio?error=limite_alcanzado`);
    }
  }

  return <>{children}</>;
}
