import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import ProfileDashboard from '@/components/features/ProfileDashboard';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function PerfilPage({ params }: PageProps) {
  const [{ user, profile }, resolvedParams] = await Promise.all([
    getAuthenticatedUser(),
    params
  ]);
  const lang = resolvedParams?.lang || 'es';
  
  if (!user) redirect(`/${lang}/login`);

  return (
    <main className="px-5 md:px-16 pb-24 pt-4">
      {/* Profile Section */}
      <section className="py-8 w-full max-w-280 mx-auto">

        <ProfileDashboard profile={profile} user={user} />
      </section>
    </main>
  );
}
