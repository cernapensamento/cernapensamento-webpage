import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import EditarArticuloForm from '@/components/forms/EditarArticuloForm';
import {
  getPublicationBySlug,
  hasPermission,
  PERMISSIONS,
  PUBLICATION_STATUSES,
} from '@/lib/db';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';

interface Props {
  params: Promise<{ slug: string; lang: string }>;
}

export default async function EditarArticuloPage({ params }: Props) {
  const [resolvedParams, { user, permissions }] = await Promise.all([
    params,
    getAuthenticatedUser(),
  ]);
  const lang = resolveLocale(resolvedParams?.lang);
  const slug = resolvedParams.slug;

  if (!user) {
    redirect(`/${lang}/login`);
  }

  if (!hasPermission(permissions, PERMISSIONS.DESK_ACCESS)) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  const [publication, dict] = await Promise.all([
    getPublicationBySlug(slug, { lang }),
    getDictionary(lang),
  ]);

  if (!publication) {
    notFound();
  }

  const isAuthor = publication.author.id === user.id;
  const isPublished = publication.status === PUBLICATION_STATUSES.PUBLISHED;
  const isInReview = publication.status === PUBLICATION_STATUSES.IN_REVIEW;
  const canUpdateAny = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_UPDATE_ANY);
  const canUpdateOwn = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_UPDATE_OWN);
  const canPublish = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_PUBLISH);
  const canReview = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_REVIEW);

  const canEdit = isAuthor
    ? isPublished
      ? canPublish || canUpdateAny
      : canUpdateOwn || canUpdateAny || (isInReview && canReview)
    : canUpdateAny || (isInReview && canReview);

  if (!canEdit) {
    redirect(`/${lang}/escritorio`);
  }

  return (
    <EditarArticuloForm
      publication={publication}
      permissions={permissions}
      lang={lang}
      dict={dict.articleEditor}
    />
  );
}
