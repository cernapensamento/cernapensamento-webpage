import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import ProfileForm from '@/components/ProfileForm';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';

export default async function PerfilPage() {
  const { user, profile } = await getAuthenticatedUser();
  if (!user) redirect('/login');

  return (
    <main className="px-5 md:px-16 pb-24 pt-16">

          {/* Profile Section */}
          <section className="py-24 px-5 md:px-16 w-full max-w-[1120px] mx-auto">
            <h2 className="font-serif text-4xl text-charcoal mb-12">Perfil del Autor</h2>
            
            <div className="bg-surface border border-lines p-10 md:p-16 flex flex-col md:flex-row gap-12">
              <div className="w-40 h-40 shrink-0 border border-lines p-1 relative">
                <Image className="object-cover grayscale" alt="Writer Portrait" src={profile?.avatar_url || DEFAULT_AVATAR_URL} fill sizes="160px"/>
              </div>
              
              <div className="flex-grow flex flex-col justify-center">
                <h3 className="font-serif text-3xl text-charcoal mb-2">{profile?.nombre || 'Nombre no disponible'}</h3>
                <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] font-bold mb-8">
                  {profile?.rol === 'admin' ? 'Administrador / Editor en Jefe' : profile?.rol === 'escritor' ? 'Escritor' : 'Lector'}
                </p>

                <div className="space-y-6">
                  <div>
                    <span className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Correo Electrónico</span>
                    <span className="font-sans text-lg text-charcoal">{user.email}</span>
                  </div>
                  <div>
                    <span className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Identificador de Usuario</span>
                    <span className="font-sans text-sm text-charcoal/80">{user.id}</span>
                  </div>
                  <div>
                    <span className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Fecha de Ingreso</span>
                    <span className="font-sans text-base text-charcoal/80">{new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
                
                <ProfileForm profile={profile} />
              </div>
            </div>
          </section>
        </main>
  );
}
