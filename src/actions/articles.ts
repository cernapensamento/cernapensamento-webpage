"use server";

import { getAuthenticatedUser } from '@/lib/auth';
import { updatePublicationStatus, getPublicationCards, formatDbError } from '@/lib/db';
import type { PublicationStatus, PublicationType, PublicationCardItem } from '@/lib/db';
import { USER_ROLES } from '@/lib/db/schema';

export async function fetchMoreArticlesAction(options: {
  offset: number;
  limit?: number;
  type?: PublicationType;
  tagSlugs?: string[];
  searchQuery?: string;
  lang?: string;
}): Promise<{ success: boolean; publications: PublicationCardItem[]; error?: string }> {
  try {
    const publications = await getPublicationCards({
      offset: options.offset,
      limit: options.limit ?? 10,
      type: options.type,
      tagSlugs: options.tagSlugs,
      searchQuery: options.searchQuery,
      lang: options.lang,
    });
    return { success: true, publications };
  } catch (err: unknown) {
    console.warn('[Action:fetchMoreArticles] Failed:', formatDbError(err));
    return { success: false, publications: [], error: 'Error al cargar más publicaciones' };
  }
}

export async function updateArticleState(
  publicationId: string,
  newState: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, role } = await getAuthenticatedUser();
    
    if (!user || !role) {
      return { success: false, error: 'No autorizado' };
    }

    // Only allow admin, founder, or legacy escritor to review and publish
    const canManageStatus = [
      USER_ROLES.ADMIN,
      USER_ROLES.FOUNDER,
      'escritor',
    ].includes(role);

    if (!canManageStatus) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    const { success, error } = await updatePublicationStatus(
      publicationId,
      newState as PublicationStatus
    );

    if (error || !success) {
      console.error('Error actualizando estado:', error);
      return { success: false, error: error?.message || 'Error al actualizar el estado' };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Action error:', err);
    const message = err instanceof Error ? err.message : 'Error del servidor';
    return { success: false, error: message };
  }
}
