'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DB_TABLES, COMMENT_COLS } from '@/lib/db/schema';

export default function CommentForm({
  articuloId,
  publicationId,
  onCommentAdded,
}: {
  articuloId?: string;
  publicationId?: string;
  onCommentAdded: () => void;
}) {
  const targetId = publicationId || articuloId || '';
  const [contenido, setContenido] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim() || !targetId) return;

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from(DB_TABLES.COMMENTS)
      .insert({
        [COMMENT_COLS.PUBLICATION_ID]: targetId,
        [COMMENT_COLS.AUTHOR_ID]: user.id,
        [COMMENT_COLS.CONTENT]: contenido.trim(),
      });

    if (error) {
      if (error.code === '23505') { // Postgres unique violation error code
        alert('Ya has comentado en este artículo.');
      } else {
        alert('Error al publicar el comentario.');
      }
    } else {
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
