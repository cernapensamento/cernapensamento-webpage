'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
export default function CommentForm({ articuloId, onCommentAdded }: { articuloId: string, onCommentAdded: () => void }) {
  const [contenido, setContenido] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim()) return;

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('comentarios')
      .insert({
        articulo_id: articuloId,
        autor_id: user.id,
        contenido: contenido.trim()
      });

    if (!error) {
      setContenido('');
      onCommentAdded(); // Refresh comments without reloading the page
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h4 className="font-sans text-xs uppercase tracking-widest text-charcoal font-semibold mb-2">Deja tu comentario</h4>
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder="Escribe aquí tu reflexión sobre el artículo..."
        className="w-full bg-transparent border border-lines p-4 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-gold transition-colors duration-300 resize-y min-h-[120px]"
        disabled={isSubmitting}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !contenido.trim()}
          className="px-6 py-3 bg-charcoal text-parchment hover:bg-gold font-sans text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Publicando...' : 'Publicar comentario'}
        </button>
      </div>
    </form>
  );
}
