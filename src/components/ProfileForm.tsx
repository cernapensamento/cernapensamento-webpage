'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfileForm({ profile }: { profile: any }) {
  const [nombre, setNombre] = useState(profile?.nombre || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
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
        .update({ nombre, bio, avatar_url: avatarUrl })
        .eq('id', profile.id);

      if (error) throw error;
      
      setMessage('Perfil actualizado exitosamente.');
      router.refresh();
    } catch (error: any) {
      setMessage(`Error al actualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-6 mt-8">
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
          rows={3}
          className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
        />
      </div>
      <div>
        <label className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">URL del Avatar</label>
        <input
          type="text"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
        />
      </div>

      {message && (
        <div className={`p-4 text-sm ${message.includes('Error') ? 'border border-red-200 bg-red-50 text-red-800' : 'border border-green-200 bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-charcoal text-parchment hover:bg-gold transition-colors font-semibold text-xs uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  );
}
