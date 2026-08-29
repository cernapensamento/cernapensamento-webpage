import React from 'react';
import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { ARTICLE_STATES } from '@/lib/constants';
import { redirect, notFound } from 'next/navigation';
import EditarArticuloForm from '@/components/forms/EditarArticuloForm';

interface Props {
  params: Promise<{ slug: string, lang: string }>;
}

export default async function EditarArticuloPage({ params }: Props) {
  const [resolvedParams, { user, profile }] = await Promise.all([
    params,
    getAuthenticatedUser()
  ]);
  const { slug, lang = 'es' } = resolvedParams;

  if (!user || !profile) {
    redirect(`/${lang}/login`);
  }

  // Verificar rol de escritor/admin globalmente
  if (profile.rol === 'usuario') {
    redirect(`/${lang}/escritorio/perfil`);
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
  if (articulo.autor_id !== user.id && profile.rol !== 'admin' && !(profile.rol === 'escritor' && articulo.estado === ARTICLE_STATES.PENDING)) {
    redirect(`/${lang}/escritorio`);
  }

  return <EditarArticuloForm articulo={articulo} userRole={profile.rol} />;
}
