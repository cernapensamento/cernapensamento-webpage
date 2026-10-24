import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DB_TABLES, PUBLICATION_COLS, USER_ROLES } from '@/lib/db/schema';

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

  const roleStr = String(profile?.role || profile?.rol || '');
  const isAllowed = [
    USER_ROLES.FOUNDER,
    USER_ROLES.MEMBER,
    USER_ROLES.GUEST,
    USER_ROLES.ADMIN,
    'escritor',
    'invitado',
  ].includes(roleStr as (typeof USER_ROLES)[keyof typeof USER_ROLES]);

  if (!isAllowed) {
    redirect(`/${lang}/escritorio/perfil`);
  }

  if (roleStr === USER_ROLES.GUEST || roleStr === 'invitado') {
    const supabase = await createClient();
    const { data: publications } = await supabase
      .from(DB_TABLES.PUBLICATIONS)
      .select(PUBLICATION_COLS.CREATED_AT)
      .eq(PUBLICATION_COLS.AUTHOR_ID, user.id);

    const allPublications = publications || [];
    const currentYear = new Date().getFullYear();
    const pubThisYear = allPublications.filter((p) => new Date(p.created_at).getFullYear() === currentYear).length;

    if (allPublications.length >= 4 || pubThisYear >= 2) {
      redirect(`/${lang}/escritorio?error=limite_alcanzado`);
    }
  }

  return <>{children}</>;
}
