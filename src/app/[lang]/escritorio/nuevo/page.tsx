import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';
import { canAccessWriterDesk } from '@/lib/db';
import EditarArticuloForm from '@/components/forms/EditarArticuloForm';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function NuevoArticuloPage({ params }: Props) {
  const [resolvedParams, { user, role }] = await Promise.all([
    params,
    getAuthenticatedUser(),
  ]);
  const lang = resolveLocale(resolvedParams?.lang);

  if (!user) {
    redirect(`/${lang}/login`);
  }

  if (!canAccessWriterDesk(role)) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  const dict = await getDictionary(lang);

  return (
    <EditarArticuloForm
      mode="create"
      userRole={role}
      lang={lang}
      dict={dict.articleEditor}
    />
  );
}
