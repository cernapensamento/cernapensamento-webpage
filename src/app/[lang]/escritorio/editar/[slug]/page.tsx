import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import EditarArticuloForm from '@/components/forms/EditarArticuloForm';
import {
  getPublicationBySlug,
  canAccessWriterDesk,
  canPublishDirectly,
} from '@/lib/db';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';

interface Props {
  params: Promise<{ slug: string; lang: string }>;
}

export default async function EditarArticuloPage({ params }: Props) {
  const [resolvedParams, { user, role }] = await Promise.all([
    params,
    getAuthenticatedUser(),
  ]);
  const lang = resolveLocale(resolvedParams?.lang);
  const slug = resolvedParams.slug;

  if (!user) {
    redirect(`/${lang}/login`);
  }

  if (!canAccessWriterDesk(role)) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  const [publication, dict] = await Promise.all([
    getPublicationBySlug(slug, { lang }),
    getDictionary(lang),
  ]);

  if (!publication) {
    notFound();
  }

  // Verify that user is author or privileged reviewer (admin/founder)
  const isAuthor = publication.author.id === user.id;
  const isPrivileged = canPublishDirectly(role);

  if (!isAuthor && !isPrivileged) {
    redirect(`/${lang}/escritorio`);
  }

  return (
    <EditarArticuloForm
      publication={publication}
      userRole={role}
      lang={lang}
      dict={dict.articleEditor}
    />
  );
}
