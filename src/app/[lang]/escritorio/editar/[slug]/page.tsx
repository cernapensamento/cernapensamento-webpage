import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import EditarArticuloForm from '@/components/forms/EditarArticuloForm';
import { getPublicationBySlug } from '@/lib/db/queries/publications';
import {
  USER_ROLES,
  PUBLICATION_STATUSES,
  isReaderRole,
  canPublishDirectly,
} from '@/lib/db/schema';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';

interface Props {
  params: Promise<{ slug: string; lang: string }>;
}

export default async function EditarArticuloPage({ params }: Props) {
  const [resolvedParams, { user, profile }] = await Promise.all([
    params,
    getAuthenticatedUser(),
  ]);
  const { slug, lang = 'gl' } = resolvedParams;

  if (!user || !profile) {
    redirect(`/${lang}/login`);
  }

  const roleStr = String(profile.role || profile.rol || USER_ROLES.READER);

  // Block reader role from writer desk
  if (isReaderRole(roleStr)) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  const supabase = await createClient();
  const [publication, dict] = await Promise.all([
    getPublicationBySlug(slug, { client: supabase }),
    getDictionary(lang as Locale),
  ]);

  if (!publication) {
    notFound();
  }

  // Verify that user is author, or privileged reviewer (admin/founder)
  const isAuthor = publication.author.id === user.id;
  const isPrivileged = canPublishDirectly(roleStr);
  const isReviewer =
    isPrivileged && publication.status === PUBLICATION_STATUSES.IN_REVIEW;

  if (!isAuthor && !isPrivileged && !isReviewer) {
    redirect(`/${lang}/escritorio`);
  }

  return (
    <EditarArticuloForm
      publication={publication}
      userRole={roleStr}
      lang={lang}
      dict={dict.articleEditor}
    />
  );
}
