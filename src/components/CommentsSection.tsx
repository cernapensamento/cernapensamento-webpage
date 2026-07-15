import { createClient } from '@/utils/supabase/server';
import CommentForm from './CommentForm';

export default async function CommentsSection({ articuloId }: { articuloId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: comentarios } = await supabase
    .from('comentarios')
    .select('id, contenido, creado_en, perfiles(nombre, avatar_url)')
    .eq('articulo_id', articuloId)
    .order('creado_en', { ascending: true });

  return (
    <section className="w-full border-t border-lines pt-16 mt-16">
      <h3 className="font-serif text-2xl text-charcoal mb-8">Comentarios ({comentarios?.length || 0})</h3>
      
      <div className="flex flex-col gap-8 mb-12">
        {comentarios?.map((comentario) => (
          <div key={comentario.id} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-lines flex-shrink-0 border border-charcoal/10 overflow-hidden relative">
               <div className="w-full h-full flex items-center justify-center font-sans text-xs uppercase tracking-widest text-charcoal/60 bg-surface">
                  {comentario.perfiles?.nombre?.substring(0, 2) || 'US'}
               </div>
            </div>
            <div className="flex flex-col flex-grow">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-sans text-sm font-semibold text-charcoal">{comentario.perfiles?.nombre || 'Usuario'}</span>
                <time className="font-sans text-[10px] uppercase tracking-widest text-charcoal/50">
                  {new Date(comentario.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </time>
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
        <CommentForm articuloId={articuloId} />
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
