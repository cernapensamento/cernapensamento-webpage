import React from 'react';
import { getAuthenticatedUser } from '@/utils/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function NuevoArticuloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  if (!['escritor', 'admin', 'invitado'].includes(profile?.rol)) {
    redirect('/escritorio/perfil');
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
      redirect('/escritorio?error=limite_alcanzado');
    }
  }

  return <>{children}</>;
}
