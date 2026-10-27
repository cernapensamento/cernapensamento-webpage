'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import CommentForm from '@/components/forms/CommentForm';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DB_TABLES, COMMENT_COLS, USER_COLS } from '@/lib/db/schema';
import { useConfirm, useToast } from '@/components/ui/FeedbackProvider';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface CommentAuthor {
  full_name?: string;
  nombre?: string;
  avatar_url?: string | null;
  slug?: string | null;
}

interface CommentViewItem {
  id: string;
  author_id: string;
  content: string;
  updated_at: string;
  author?: CommentAuthor | null;
}

export default function CommentsSection({
  articuloId,
  publicationId,
}: {
  articuloId?: string;
  publicationId?: string;
}) {
  const targetId = publicationId || articuloId || '';
  const params = useParams();
  const lang = (params?.lang as string) || 'gl';
  const dict = lang === 'es' ? esDict : glDict;
  const cDict = dict.comments;
  const confirm = useConfirm();
  const toast = useToast();

  const { user } = useAuth();
  const [comentarios, setComentarios] = useState<CommentViewItem[]>([]);
  const loading = useRef(true);
  const supabase = createClient();

  const fetchComments = useCallback(async () => {
    if (!targetId) return;

    const { data, error } = await supabase
      .from(DB_TABLES.COMMENTS)
      .select(`
        ${COMMENT_COLS.ID},
        ${COMMENT_COLS.AUTHOR_ID},
        ${COMMENT_COLS.CONTENT},
        ${COMMENT_COLS.UPDATED_AT},
        author:${DB_TABLES.USERS} (
          ${USER_COLS.FULL_NAME},
          ${USER_COLS.AVATAR_URL},
          ${USER_COLS.SLUG}
        )
      `)
      .eq(COMMENT_COLS.PUBLICATION_ID, targetId)
      .order(COMMENT_COLS.UPDATED_AT, { ascending: true });

    if (!error && data) {
      setComentarios(data as unknown as CommentViewItem[]);
    }
    loading.current = false;
  }, [targetId, supabase]);

  const handleDelete = async (comentarioId: string) => {
    const ok = await confirm({
      title: cDict.delete,
      description: cDict.deleteConfirm,
      confirmLabel: cDict.delete,
      cancelLabel: dict.common.cancel,
      variant: 'danger',
    });
    if (!ok) return;

    // Optimistic update
    setComentarios(prev => prev.filter(c => c.id !== comentarioId));

    const { data, error } = await supabase
      .from(DB_TABLES.COMMENTS)
      .delete()
      .eq(COMMENT_COLS.ID, comentarioId)
      .select();

    if (error || !data || data.length === 0) {
      console.error("Delete failed:", error || "No rows deleted (RLS blocked)");
      toast.error(cDict.deleteError);
      const timer = setTimeout(() => fetchComments(), 0);
      return () => clearTimeout(timer);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchComments(), 0);
    return () => clearTimeout(timer);
  }, [targetId, fetchComments]);

  return (
    <section data-print="hide" className="w-full border-t border-lines pt-12 mt-8">
      <h3 className="font-serif text-2xl text-charcoal mb-8">{cDict.title || 'Comentarios'} ({comentarios?.length || 0})</h3>
      
      <div className="flex flex-col gap-8 mb-12">
        {comentarios?.map((comentario) => {
          const authorName = comentario.author?.full_name || comentario.author?.nombre || cDict.unknownUser || 'Usuario';
          const avatarUrl = comentario.author?.avatar_url;

          return (
            <div key={comentario.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-lines flex-shrink-0 border border-charcoal/10 overflow-hidden relative">
                {avatarUrl ? (
                  <Image 
                    src={avatarUrl} 
                    alt={authorName} 
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-sans text-xs uppercase tracking-widest text-charcoal/60 bg-surface">
                    {authorName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-grow">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-3">
                    <span className="font-sans text-sm font-semibold text-charcoal">{authorName}</span>
                    <time className="font-sans text-[10px] uppercase tracking-widest text-charcoal/50">
                      {new Date(comentario.updated_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'gl-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                    </time>
                  </div>
                  {user && user.id === comentario.author_id && (
                    <button type="button" 
                      onClick={() => handleDelete(comentario.id)}
                      className="text-[10px] uppercase tracking-widest text-red-600/70 hover:text-red-600 transition-colors cursor-pointer"
                      title={cDict.delete || 'Eliminar'}
                    >
                      {cDict.delete || 'Eliminar'}
                    </button>
                  )}
                </div>
                <p className="font-sans text-sm text-charcoal/80 leading-relaxed whitespace-pre-wrap">
                  {comentario.content}
                </p>
              </div>
            </div>
          );
        })}
        {(!comentarios || comentarios.length === 0) && (
          <p className="font-sans text-sm text-charcoal/60 italic">{cDict.empty}</p>
        )}
      </div>

      {user ? (
        comentarios?.some(c => c.author_id === user.id) ? (
          <div className="bg-surface border border-lines p-8 text-center mt-8">
            <p className="font-sans text-sm text-charcoal/70">{cDict.alreadyCommented}</p>
          </div>
        ) : (
          <CommentForm articuloId={targetId} onCommentAdded={fetchComments} dict={cDict} />
        )
      ) : (
        <div className="bg-surface border border-lines p-8 text-center">
          <p className="font-sans text-sm text-charcoal/70 mb-4">{cDict.mustLogin}</p>
          <Link href={`/${lang}/login`} className="inline-block px-6 py-3 border border-charcoal text-charcoal hover:bg-charcoal hover:text-parchment font-sans text-[10px] uppercase tracking-[0.2em] transition-colors duration-300">
            {cDict.loginBtn}
          </Link>
        </div>
      )}
    </section>
  );
}
