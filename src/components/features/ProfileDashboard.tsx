'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import PasswordForm from '@/components/forms/PasswordForm';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import { handleSignOut } from '@/actions/auth';

export default function ProfileDashboard({ profile, user }: { profile: any, user: any }) {
  const [nombre, setNombre] = useState(profile?.nombre || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [recibirNewsletter, setRecibirNewsletter] = useState(profile?.recibir_newsletter ?? true);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const isEmailAuth = user?.app_metadata?.providers?.includes('email');
  
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
        .eq('id', profile?.id || user?.id);

      if (error) throw error;
      setMessage('Perfil actualizado exitosamente.');
      window.dispatchEvent(new Event('profile_updated'));
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      setMessage(`Error al actualizar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede superar los 2 MB');
      return;
    }

    setIsUploading(true);
    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);

    const ext = file.name.split('.').pop();
    const path = `avatares/${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('imagenes-articulos')
      .upload(path, file, { upsert: true });

    if (error) {
      alert('Error al subir la imagen: ' + error.message);
      setAvatarUrl(profile?.avatar_url || '');
    } else {
      // Eliminar el avatar anterior si era de Supabase Storage
      const currentUrl = profile?.avatar_url || avatarUrl;
      if (currentUrl && currentUrl.includes('supabase.co/storage/v1/object/public/imagenes-articulos/')) {
          const oldPath = currentUrl.split('imagenes-articulos/')[1];
          if (oldPath && oldPath !== path) {
              supabase.storage.from('imagenes-articulos').remove([oldPath]).catch(console.error);
          }
      }

      const { data: urlData } = supabase.storage
        .from('imagenes-articulos')
        .getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);

      // Auto-save to DB immediately so refresh doesn't lose the new image
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', profile?.id || user?.id);
      if (updateError) {
        console.error('Error al guardar avatar en DB:', updateError.message);
      } else {
        window.dispatchEvent(new Event('profile_updated'));
        router.refresh();
      }
    }

    URL.revokeObjectURL(localPreview);
    setIsUploading(false);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  return (
    <div className="bg-surface border border-lines p-6 sm:p-10 md:p-16">
      {/* Header Section (Avatar + Name) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-lines mb-6">
        <div className="flex items-center gap-6 sm:gap-8">
          <input 
            type="file" 
            ref={avatarInputRef} 
            onChange={handleAvatarFileSelected} 
            accept="image/jpeg,image/png,image/webp" 
            className="hidden" 
          />
          <div 
            className={`w-20 h-20 sm:w-24 sm:h-24 shrink-0 relative group overflow-hidden rounded-full border border-lines ${isUploading ? 'cursor-wait opacity-50 animate-pulse' : 'cursor-pointer'}`} 
            onClick={!isUploading ? handleChangeAvatar : undefined}
            onKeyDown={!isUploading ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChangeAvatar(); } } : undefined}
            role="button"
            tabIndex={0}
            title="Cambiar imagen de perfil"
          >
            <Image className="object-cover transition-all group-hover:opacity-30" alt="Writer Portrait" src={avatarUrl || DEFAULT_AVATAR_URL} fill sizes="(max-width: 640px) 80px, 96px"/>
            {!isUploading && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-charcoal/10">
                <span className="bg-charcoal text-parchment text-[10px] uppercase tracking-widest px-2 py-1 text-center font-sans">
                  Cambiar
                </span>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-charcoal/30 pointer-events-none">
                <span className="material-symbols-outlined text-parchment animate-spin text-[24px]">sync</span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl text-charcoal mb-1">{nombre || 'Nombre no disponible'}</h3>
            <p className="font-sans text-[10px] sm:text-xs text-gold uppercase tracking-[0.2em] font-bold">
              {profile?.rol === 'admin' ? 'Administrador / Editor en Jefe' : profile?.rol === 'escritor' ? 'Escritor' : profile?.rol === 'invitado' ? 'Autor Invitado' : 'Lector'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="text-left">
          {/* Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <span className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Correo Electrónico</span>
              <span className="font-sans text-sm sm:text-base text-charcoal">{user?.email}</span>
            </div>
            <div>
              <span className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Fecha de Ingreso</span>
              <span className="font-sans text-sm sm:text-base text-charcoal/80">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Desconocida'}
              </span>
            </div>
          </div>

          {/* Profile Form */}
          <form id="profile-form" onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Nombre</label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Biografía</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                rows={3}
                placeholder="Escribe algo sobre ti..."
                className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-charcoal transition-colors rounded-none resize-none overflow-hidden min-h-[80px]"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="newsletter"
                checked={recibirNewsletter}
                onChange={(e) => setRecibirNewsletter(e.target.checked)}
                className="w-4 h-4 text-gold border-lines rounded focus:ring-gold accent-gold"
              />
              <label htmlFor="newsletter" className="font-sans text-sm text-charcoal cursor-pointer">
                Recibir notificaciones por correo de nuevas publicaciones
              </label>
            </div>
          </form>


          {/* Password Form */}
          {isEmailAuth && (
            <div className="pt-6 mt-6 text-left">
              <h4 className="font-serif text-xl text-charcoal mb-4">Seguridad</h4>
              <PasswordForm />
            </div>
          )}

          {message && (
            <div className={`p-4 mt-6 text-sm ${message.includes('Error') ? 'border border-red-200 bg-red-50 text-red-800' : 'border border-green-200 bg-green-50 text-green-800'}`}>
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 mt-8 border-t border-lines">
            <button
              type="submit"
              form="profile-form"
              disabled={loading || isUploading}
              className="group relative px-6 py-3 bg-charcoal text-parchment hover:bg-gold hover:text-charcoal transition-all duration-500 ease-out font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] disabled:opacity-50 border border-charcoal hover:border-gold overflow-hidden shrink-0 w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Guardando...' : 'Guardar Cambios'}
                {!loading && <span className="material-symbols-outlined text-[14px] transition-transform duration-500 group-hover:translate-x-1">arrow_forward</span>}
              </span>
            </button>
            <form action={handleSignOut} className="w-full sm:w-auto">
              <button type="submit" className="flex items-center justify-center gap-3 py-3 px-4 bg-transparent border border-lines/50 text-charcoal/50 hover:bg-red-50/50 hover:text-red-500 hover:border-red-500/20 transition-all duration-300 group w-full cursor-pointer shrink-0 rounded-sm">
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:-translate-x-1" data-icon="logout">logout</span>
                <span className="font-sans text-xs uppercase tracking-[0.15em] transition-colors duration-300">Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </div>
    </div>
  );
}
