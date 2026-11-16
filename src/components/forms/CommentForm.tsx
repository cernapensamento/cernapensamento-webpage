'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createComment } from '@/lib/db';
import { useToast } from '@/components/ui/FeedbackProvider';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient, type Dictionary } from '@/dictionaries/client';

type CommentFormDict = Partial<Dictionary['comments']>;

interface CommentFormProps {
  articuloId?: string;
  publicationId?: string;
  onCommentAdded: () => void;
  dict?: CommentFormDict;
}

export default function CommentForm({
  articuloId,
  publicationId,
  onCommentAdded,
  dict,
}: CommentFormProps) {
  const targetId = publicationId || articuloId || '';
  const lang = useLocale();
  const fallbackComments = getDictionaryClient(lang).comments;
  const cDict: Dictionary['comments'] = {
    ...fallbackComments,
    ...dict,
  };
  const toast = useToast();

  const [contenido, setContenido] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim() || !targetId) return;

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Use createComment (insert, not upsert) so Postgres error 23505 detects duplicate comments
      const { error } = await createComment(targetId, user.id, contenido.trim(), supabase);

      if (error) {
        if (error.code === '23505') {
          toast.warning(cDict.alreadyCommented || fallbackComments.alreadyCommented);
        } else {
          toast.error(cDict.postError || fallbackComments.postError);
        }
        return;
      }

      setContenido('');
      onCommentAdded(); // Refresh comments without reloading the page
    } catch {
      toast.error(cDict.postError || fallbackComments.postError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h4 className="font-sans text-xs uppercase tracking-widest text-charcoal font-semibold mb-2">
        {cDict.leaveComment || fallbackComments.leaveComment}
      </h4>
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder={cDict.placeholder || fallbackComments.placeholder}
        className="w-full bg-transparent border border-lines p-4 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-gold transition-colors duration-300 resize-y min-h-[120px]"
        disabled={isSubmitting}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !contenido.trim()}
          className="px-6 py-3 bg-charcoal text-parchment hover:bg-gold font-sans text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting
            ? (cDict.submitting || fallbackComments.submitting)
            : (cDict.submit || fallbackComments.submit)}
        </button>
      </div>
    </form>
  );
}
