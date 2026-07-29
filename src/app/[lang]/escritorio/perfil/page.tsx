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

  const isWriter = profile?.rol === 'escritor' || profile?.rol === 'admin' || profile?.rol === 'invitado';

  return (
    <main className="px-5 md:px-16 pb-24 pt-4">
      {/* Profile Section */}
      <section className="py-8 w-full max-w-[1120px] mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-8 md:mb-12 text-center md:text-left">
          {isWriter 
            ? (lang === 'es' ? 'Perfil del Autor' : 'Perfil do Autor') 
            : (lang === 'es' ? 'Perfil del Lector' : 'Perfil do Lector')}
        </h2>
        <ProfileDashboard profile={profile} user={user} />
      </section>
    </main>
  );
}
