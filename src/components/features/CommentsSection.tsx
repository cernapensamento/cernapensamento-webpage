'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import CommentForm from '@/components/forms/CommentForm';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';
import {
  getCommentsForPublication,
  deleteComment,
} from '@/lib/db';
import type { CommentItem } from '@/lib/db/types';
import FormattedDate from '@/components/ui/FormattedDate';
import { useConfirm, useToast } from '@/components/ui/FeedbackProvider';

export default function CommentsSection({
  articuloId,
  publicationId,
}: {
  articuloId?: string;
  publicationId?: string;
}) {
  const targetId = publicationId || articuloId || '';
  const lang = useLocale();
  const dict = getDictionaryClient(lang);
  const cDict = dict.comments;
  const confirm = useConfirm();
  const toast = useToast();

  const { user } = useAuth();
  const [comentarios, setComentarios] = useState<CommentItem[]>([]);
  const supabase = useMemo(() => createClient(), []);

  const fetchComments = useCallback(async () => {
    if (!targetId) return;
    const data = await getCommentsForPublication(targetId, supabase);
    setComentarios(data);
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
    setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));

    const { success, error } = await deleteComment(comentarioId, supabase);

    if (!success) {
      console.error('Delete failed:', error || 'No rows deleted (RLS blocked)');
      toast.error(cDict.deleteError);
      await fetchComments();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchComments(), 0);
    return () => clearTimeout(timer);
  }, [targetId, fetchComments]);

  return (
    <section data-print="hide" className="w-full border-t border-lines pt-12 mt-8">
      <h3 className="font-serif text-2xl text-charcoal mb-8">
        {cDict.title} ({comentarios.length})
      </h3>

      <div className="flex flex-col gap-8 mb-12">
        {comentarios.map((comentario) => {
          const authorName = comentario.author?.full_name || cDict.unknownUser;
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
                    <FormattedDate
                      date={comentario.updated_at}
                      lang={lang}
                      format="short"
                      className="font-sans text-[10px] uppercase tracking-widest text-charcoal/50"
                    />
                  </div>
                  {user && user.id === comentario.author_id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comentario.id)}
                      className="text-[10px] uppercase tracking-widest text-red-600/70 hover:text-red-600 transition-colors cursor-pointer"
                      title={cDict.delete}
                    >
                      {cDict.delete}
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
        {comentarios.length === 0 && (
          <p className="font-sans text-sm text-charcoal/60 italic">{cDict.empty}</p>
        )}
      </div>

      {user ? (
        comentarios.some((c) => c.author_id === user.id) ? (
          <div className="bg-surface border border-lines p-8 text-center mt-8">
            <p className="font-sans text-sm text-charcoal/70">{cDict.alreadyCommented}</p>
          </div>
        ) : (
          <CommentForm articuloId={targetId} onCommentAdded={fetchComments} dict={cDict} />
        )
      ) : (
        <div className="bg-surface border border-lines p-8 text-center">
          <p className="font-sans text-sm text-charcoal/70 mb-4">{cDict.mustLogin}</p>
          <Link
            href={`/${lang}/login`}
            className="inline-block px-6 py-3 border border-charcoal text-charcoal hover:bg-charcoal hover:text-parchment font-sans text-[10px] uppercase tracking-[0.2em] transition-colors duration-300"
          >
            {cDict.loginBtn}
          </Link>
        </div>
      )}
    </section>
  );
}
