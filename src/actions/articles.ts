"use server";

import { getAuthenticatedUser } from '@/lib/auth';
import { updatePublicationStatus } from '@/lib/db/queries/publications';
import type { PublicationStatus } from '@/lib/db/types';
import { USER_ROLES } from '@/lib/db/schema';

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
