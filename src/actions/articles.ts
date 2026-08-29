"use server";

import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/utils/auth';

// Use service role key to bypass RLS for administrative actions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateArticleState(articuloId: string, newState: string) {
  try {
    const { user, profile } = await getAuthenticatedUser();
    
    if (!user || !profile) {
      return { success: false, error: 'No autorizado' };
    }

    // Only allow admin or escritor to perform this action on OTHER people's articles
    if (!['admin', 'escritor'].includes(profile.rol)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    const { error } = await supabaseAdmin
      .from('articulos')
      .update({
        estado: newState,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', articuloId);

    if (error) {
      console.error('Error actualizando estado:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Action error:', err);
    return { success: false, error: err.message || 'Error del servidor' };
  }
}
