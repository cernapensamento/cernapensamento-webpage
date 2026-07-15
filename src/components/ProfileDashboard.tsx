'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import PasswordForm from '@/components/PasswordForm';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';

export default function ProfileDashboard({ profile, user }: { profile: any, user: any }) {
  const [nombre, setNombre] = useState(profile?.nombre || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [recibirNewsletter, setRecibirNewsletter] = useState(profile?.recibir_newsletter ?? true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ nombre, bio, avatar_url: avatarUrl, recibir_newsletter: recibirNewsletter })
        .eq('id', profile?.id || '');

      if (error) throw error;
      
      setMessage('Perfil actualizado exitosamente.');
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      setMessage(`Error al actualizar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = () => {
    const url = window.prompt('Introduce la URL de tu nueva imagen de perfil:', avatarUrl);
    if (url !== null && url.trim() !== '') {
      setAvatarUrl(url.trim());
    }
  };

  return (
    <div className="bg-surface border border-lines p-6 sm:p-10 md:p-16">
      {/* Header Section (Avatar + Name) */}
      <div className="flex items-center gap-6 sm:gap-8 mb-8 pb-8 border-b border-lines">
        <div 
          className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 relative group cursor-pointer overflow-hidden rounded-full border border-lines" 
          onClick={handleChangeAvatar}
          title="Cambiar imagen de perfil"
        >
          <Image className="object-cover transition-all group-hover:opacity-30" alt="Writer Portrait" src={avatarUrl || DEFAULT_AVATAR_URL} fill sizes="(max-width: 640px) 96px, 128px"/>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-charcoal/10">
            <span className="bg-charcoal text-parchment text-[10px] uppercase tracking-widest px-2 py-1 text-center font-sans">
              Cambiar
            </span>
          </div>
        </div>
        
        <div>
          <h3 className="font-serif text-2xl sm:text-3xl text-charcoal mb-2">{nombre || 'Nombre no disponible'}</h3>
          <p className="font-sans text-[10px] sm:text-xs text-gold uppercase tracking-[0.2em] font-bold">
            {profile?.rol === 'admin' ? 'Administrador / Editor en Jefe' : profile?.rol === 'escritor' ? 'Escritor' : 'Lector'}
          </p>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="text-left">
          {/* Info Section */}
          <div className="space-y-6 pb-8 border-b border-lines mb-8">
            <div>
              <span className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Correo Electrónico</span>
              <span className="font-sans text-lg text-charcoal">{user?.email}</span>
            </div>
            <div>
              <span className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Fecha de Ingreso</span>
              <span className="font-sans text-base text-charcoal/80">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Desconocida'}
              </span>
            </div>
          </div>

          {/* Profile Form */}
          <form id="profile-form" onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
              />
            </div>
            <div>
              <label className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Biografía</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={1}
                className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none resize-y min-h-[40px]"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-lines">
              <input
                type="checkbox"
                id="newsletter"
                checked={recibirNewsletter}
                onChange={(e) => setRecibirNewsletter(e.target.checked)}
                className="w-4 h-4 text-gold border-lines rounded focus:ring-gold accent-gold"
              />
              <label htmlFor="newsletter" className="font-sans text-sm text-charcoal cursor-pointer">
                Quiero recibir el boletín semanal con artículos destacados.
              </label>
            </div>
          </form>


          {/* Password Form */}
          <div className="pt-8 border-t border-lines mt-8 text-left">
            <h4 className="font-serif text-2xl text-charcoal mb-4">Seguridad</h4>
            <PasswordForm />
          </div>

          {/* Messages */}
          {message && (
            <div className={`p-4 mt-8 text-sm ${message.includes('Error') ? 'border border-red-200 bg-red-50 text-red-800' : 'border border-green-200 bg-green-50 text-green-800'}`}>
              {message}
            </div>
          )}

          {/* Save Button at the Bottom */}
          <div className="mt-12 pt-8 border-t border-lines flex justify-end">
            <button
              type="submit"
              form="profile-form"
              disabled={loading}
              className="group relative w-full md:w-auto px-10 py-4 bg-charcoal text-parchment hover:bg-gold hover:text-charcoal transition-all duration-500 ease-out font-bold text-xs uppercase tracking-[0.2em] disabled:opacity-50 border border-charcoal hover:border-gold overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? 'Guardando...' : 'Guardar Cambios'}
                {!loading && <span className="material-symbols-outlined text-[16px] transition-transform duration-500 group-hover:translate-x-1">arrow_forward</span>}
              </span>
            </button>
          </div>
        </div>
    </div>
  );
}
