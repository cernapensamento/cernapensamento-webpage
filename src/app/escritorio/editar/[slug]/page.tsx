import React from 'react';
import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import EditarArticuloForm from '@/components/escritorio/EditarArticuloForm';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditarArticuloPage({ params }: Props) {
  const { slug } = await params;
  const { user, profile } = await getAuthenticatedUser();

  if (!user || !profile) {
    redirect('/login');
  }

  // Verificar rol de escritor/admin globalmente
  if (profile.rol === 'usuario') {
    redirect('/escritorio/perfil');
  }

  const supabase = await createClient();

  // Buscar artículo por slug o por ID (seguro contra inyección)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
  let query = supabase.from('articulos').select('*');
  if (isUUID) {
    query = query.eq('id', slug);
  } else {
    query = query.eq('slug', slug);
  }
  
  const { data: articulo, error } = await query.single();

  if (error || !articulo) {
    notFound();
  }

  // Verificar que el usuario sea el autor del artículo o un admin
  if (articulo.autor_id !== user.id && profile.rol !== 'admin') {
    redirect('/escritorio');
  }

  return <EditarArticuloForm articulo={articulo} />;
}
