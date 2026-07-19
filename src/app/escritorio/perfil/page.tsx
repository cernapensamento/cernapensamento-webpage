import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import ProfileDashboard from '@/components/features/ProfileDashboard';

export default async function PerfilPage() {
  const { user, profile } = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const isWriter = profile?.rol === 'escritor' || profile?.rol === 'admin' || profile?.rol === 'invitado';

  return (
    <main className="px-5 md:px-16 pb-24 pt-4">
      {/* Profile Section */}
      <section className="py-8 w-full max-w-[1120px] mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-8 md:mb-12 text-center md:text-left">
          {isWriter ? 'Perfil del Autor' : 'Perfil del Lector'}
        </h2>
        <ProfileDashboard profile={profile} user={user} />
      </section>
    </main>
  );
}
