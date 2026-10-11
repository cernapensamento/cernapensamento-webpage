import React from 'react';
import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import EditarArticuloForm from '@/components/forms/EditarArticuloForm';
import { getPublicationBySlug } from '@/lib/db/queries/publications';
import {
  USER_ROLES,
  PUBLICATION_STATUSES,
} from '@/lib/db/schema';

interface Props {
  params: Promise<{ slug: string; lang: string }>;
}

export default async function EditarArticuloPage({ params }: Props) {
  const [resolvedParams, { user, profile }] = await Promise.all([
    params,
    getAuthenticatedUser(),
  ]);
  const { slug, lang = 'es' } = resolvedParams;

  if (!user || !profile) {
    redirect(`/${lang}/login`);
  }

  const roleStr = String(profile.role || profile.rol || USER_ROLES.READER);

  // Block reader role from writer desk
  if (roleStr === USER_ROLES.READER || roleStr === 'usuario') {
    redirect(`/${lang}/escritorio/perfil`);
  }

  const supabase = await createClient();
  const publication = await getPublicationBySlug(slug, { client: supabase });

  if (!publication) {
    notFound();
  }

  // Verify that user is author, admin, or founder reviewing pending submission
  const isAuthor = publication.author.id === user.id;
  const isAdmin = roleStr === USER_ROLES.ADMIN || roleStr === 'admin';
  const isReviewer =
    (roleStr === USER_ROLES.FOUNDER || roleStr === 'escritor') &&
    (publication.status === PUBLICATION_STATUSES.IN_REVIEW ||
      (publication as unknown as { estado?: string }).estado === 'pendiente_aprobacion');

  if (!isAuthor && !isAdmin && !isReviewer) {
    redirect(`/${lang}/escritorio`);
  }

  return <EditarArticuloForm publication={publication} userRole={roleStr} />;
}
