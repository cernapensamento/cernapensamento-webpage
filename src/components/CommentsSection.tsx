'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import CommentForm from './CommentForm';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export default function CommentsSection({ articuloId }: { articuloId: string }) {
  const { user } = useAuth();
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comentarios')
      .select('id, contenido, creado_en, autor_id, perfiles(nombre, avatar_url)')
      .eq('articulo_id', articuloId)
      .order('creado_en', { ascending: true });
    
    if (data) setComentarios(data);
    setLoading(false);
  };

  const handleDelete = async (comentarioId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    // Actualización optimista
    setComentarios(prev => prev.filter(c => c.id !== comentarioId));

    const { data, error } = await supabase
      .from('comentarios')
      .delete()
      .eq('id', comentarioId)
      .select();

    if (error || !data || data.length === 0) {
      console.error("Delete failed:", error || "No rows deleted (RLS blocked)");
      alert('Error de permisos o sesión caducada al intentar borrar. Recarga la página.');
      fetchComments(); // Revertir en caso de error
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articuloId]);

  return (
    <section className="w-full border-t border-lines pt-12 mt-8">
      <h3 className="font-serif text-2xl text-charcoal mb-8">Comentarios ({comentarios?.length || 0})</h3>
      
      <div className="flex flex-col gap-8 mb-12">
        {comentarios?.map((comentario) => (
          <div key={comentario.id} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-lines flex-shrink-0 border border-charcoal/10 overflow-hidden relative">
              {comentario.perfiles?.avatar_url ? (
                <Image 
                  src={comentario.perfiles.avatar_url} 
                  alt={comentario.perfiles?.nombre || 'Usuario'} 
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-sans text-xs uppercase tracking-widest text-charcoal/60 bg-surface">
                  {comentario.perfiles?.nombre?.substring(0, 2) || 'US'}
                </div>
              )}
            </div>
            <div className="flex flex-col flex-grow">
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-sans text-sm font-semibold text-charcoal">{comentario.perfiles?.nombre || 'Usuario'}</span>
                  <time className="font-sans text-[10px] uppercase tracking-widest text-charcoal/50">
                    {new Date(comentario.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </time>
                </div>
                {user && user.id === comentario.autor_id && (
                  <button 
                    onClick={() => handleDelete(comentario.id)}
                    className="text-[10px] uppercase tracking-widest text-red-600/70 hover:text-red-600 transition-colors cursor-pointer"
                    title="Eliminar comentario"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <p className="font-sans text-sm text-charcoal/80 leading-relaxed whitespace-pre-wrap">
                {comentario.contenido}
              </p>
            </div>
          </div>
        ))}
        {(!comentarios || comentarios.length === 0) && (
          <p className="font-sans text-sm text-charcoal/60 italic">Todavía no hay comentarios. Sé el primero en compartir tu reflexión.</p>
        )}
      </div>

      {user ? (
        <CommentForm articuloId={articuloId} onCommentAdded={fetchComments} />
      ) : (
        <div className="bg-surface border border-lines p-8 text-center">
          <p className="font-sans text-sm text-charcoal/70 mb-4">Debes iniciar sesión para unirte a la conversación.</p>
          <a href="/login" className="inline-block px-6 py-3 border border-charcoal text-charcoal hover:bg-charcoal hover:text-parchment font-sans text-[10px] uppercase tracking-[0.2em] transition-colors duration-300">
            Iniciar sesión
          </a>
        </div>
      )}
    </section>
  );
}
