import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import EditarArticuloForm from '@/components/forms/EditarArticuloForm';
import {
  canEditPublication,
  getPublicationBySlug,
  hasPermission,
  PERMISSIONS,
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

  if (!canEditPublication(permissions, publication, user.id)) {
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
