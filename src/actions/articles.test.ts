import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveArticleAction,
  fetchMoreArticlesAction,
  updateArticleState,
  deleteArticleAction,
} from './articles';
import {
  USER_ROLES,
  PERMISSIONS,
  PUBLICATION_STATUSES,
  EDITOR_ACTIONS,
  resolvePermissionsForRoles,
  type PermissionValue,
  type UserRoleValue,
} from '@/lib/db/schema';
import * as authModule from '@/lib/auth';
import * as dbModule from '@/lib/db';
import * as supabaseServerModule from '@/lib/supabase/server';
import * as storageModule from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ProfileRow, PublicationRow, PublicationDetail, PublicationCardItem, UserRole } from '@/lib/db';

function makeAuthSession(userId: string, role: UserRole) {
  return {
    user: { id: userId } as unknown as User,
    profile: { id: userId, roles: [role] } as unknown as ProfileRow,
    roles: [role],
    permissions: resolvePermissionsForRoles([role]),
  };
}

function makePermissionSession(
  userId: string,
  permissions: readonly PermissionValue[],
  roles: UserRoleValue[] = []
) {
  return {
    user: { id: userId } as unknown as User,
    profile: { id: userId, roles, permissions } as unknown as ProfileRow,
    roles,
    permissions: [...permissions],
  };
}

const UNAUTH_SESSION = {
  user: null,
  profile: null,
  roles: [],
  permissions: [],
};

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/storage')>();
  return {
    ...actual,
    sweepPublicationStorageFolder: vi.fn(),
    cleanupPublicationImages: vi.fn(),
  };
});

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    createPublication: vi.fn(),
    updatePublication: vi.fn(),
    getPublicationById: vi.fn(),
    getPublicationAssetsForCleanup: vi.fn(),
    deletePublication: vi.fn(),
    syncPublicationTagsBySlugs: vi.fn(),
    getPublicationCards: vi.fn(),
    updatePublicationStatus: vi.fn(),
  };
});

describe('saveArticleAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseInput = {
    title: { gl: 'Título en Galego', es: 'Título en Español' },
    subtitle: { gl: 'Subtítulo gl', es: 'Subtítulo es' },
    content: { gl: '<p>Texto gl</p>', es: '<p>Texto es</p>' },
    cover_image_url: 'https://example.com/cover.webp',
    tags: ['filosofia', 'politica'],
    type: 'article',
    original_language: 'gl',
    action: EDITOR_ACTIONS.DRAFT,
    lang: 'gl',
  };

  it('fails if user is not authenticated', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(UNAUTH_SESSION);

    const result = await saveArticleAction(baseInput);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Non autorizado');
  });

  it('fails if user has reader role', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('reader-1', USER_ROLES.READER)
    );

    const result = await saveArticleAction(baseInput);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Permisos insuficientes');
  });

  it('rejects direct publish if user role is not admin or founder', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    const result = await saveArticleAction({
      ...baseInput,
      action: EDITOR_ACTIONS.PUBLISH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('só os fundadores e administradores poden publicar');
  });

  it('creates a draft publication successfully for a member', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    vi.mocked(dbModule.createPublication).mockResolvedValue({
      data: { id: 'new-pub-123' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      action: EDITOR_ACTIONS.DRAFT,
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe('new-pub-123');
    expect(result.slug).toMatch(/^titulo-en-galego-[a-z0-9]{6}$/);
    expect(dbModule.createPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PUBLICATION_STATUSES.DRAFT,
        published_at: null,
        author_id: 'member-1',
      })
    );
    expect(dbModule.syncPublicationTagsBySlugs).toHaveBeenCalledWith(
      'new-pub-123',
      ['filosofia', 'politica']
    );
  });

  it('allows an admin or founder to directly publish a new article', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('admin-1', USER_ROLES.ADMIN)
    );

    vi.mocked(dbModule.createPublication).mockResolvedValue({
      data: { id: 'admin-pub-1' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      action: EDITOR_ACTIONS.PUBLISH,
    });

    expect(result.success).toBe(true);
    expect(dbModule.createPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PUBLICATION_STATUSES.PUBLISHED,
        published_at: expect.any(String),
      })
    );
  });

  it('updates an existing publication, preserving original published_at if already published', async () => {
    const originalPublishedAt = '2026-05-01T10:00:00Z';
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('author-1', USER_ROLES.FOUNDER)
    );

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-exist-1',
      slug: 'artigo-existente-abc123',
      status: PUBLICATION_STATUSES.PUBLISHED,
      published_at: originalPublishedAt,
      author: { id: 'author-1' },
    } as unknown as PublicationDetail);

    vi.mocked(dbModule.updatePublication).mockResolvedValue({
      data: { id: 'pub-exist-1' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      id: 'pub-exist-1',
      action: EDITOR_ACTIONS.PUBLISH,
    });

    expect(result.success).toBe(true);
    expect(dbModule.updatePublication).toHaveBeenCalledWith(
      'pub-exist-1',
      expect.objectContaining({
        status: PUBLICATION_STATUSES.PUBLISHED,
        published_at: originalPublishedAt,
      })
    );
  });

  it('stamps a fresh published_at when publishing an existing draft even if stale published_at is present', async () => {
    const staleDraftDate = '2026-01-01T10:00:00Z';
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('author-1', USER_ROLES.FOUNDER)
    );

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-draft-1',
      slug: 'borrador-antigo-abc123',
      status: PUBLICATION_STATUSES.DRAFT,
      created_at: staleDraftDate,
      published_at: staleDraftDate,
      author: { id: 'author-1' },
    } as unknown as PublicationDetail);

    vi.mocked(dbModule.updatePublication).mockResolvedValue({
      data: { id: 'pub-draft-1' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      id: 'pub-draft-1',
      action: EDITOR_ACTIONS.PUBLISH,
    });

    expect(result.success).toBe(true);
    expect(dbModule.updatePublication).toHaveBeenCalledWith(
      'pub-draft-1',
      expect.objectContaining({
        status: PUBLICATION_STATUSES.PUBLISHED,
        published_at: expect.any(String),
      })
    );
    const [, payload] = vi.mocked(dbModule.updatePublication).mock.calls[0];
    expect(payload.published_at).not.toBe(staleDraftDate);
  });

  it('clears published_at when an existing publication is returned to draft', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('author-1', USER_ROLES.FOUNDER)
    );

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-exist-2',
      slug: 'artigo-a-despublicar-abc123',
      status: PUBLICATION_STATUSES.PUBLISHED,
      published_at: '2026-05-01T10:00:00Z',
      author: { id: 'author-1' },
    } as unknown as PublicationDetail);

    vi.mocked(dbModule.updatePublication).mockResolvedValue({
      data: { id: 'pub-exist-2' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      id: 'pub-exist-2',
      action: EDITOR_ACTIONS.DRAFT,
    });

    expect(result.success).toBe(true);
    expect(dbModule.updatePublication).toHaveBeenCalledWith(
      'pub-exist-2',
      expect.objectContaining({
        status: PUBLICATION_STATUSES.DRAFT,
        published_at: null,
      })
    );
  });

  it('rejects editing if user is neither author nor admin/founder', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('stranger-1', USER_ROLES.MEMBER)
    );

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-stranger-1',
      slug: 'artigo-doutro-abc123',
      status: PUBLICATION_STATUSES.DRAFT,
      author: { id: 'real-author-1' },
    } as unknown as PublicationDetail);

    const result = await saveArticleAction({
      ...baseInput,
      id: 'pub-stranger-1',
      action: EDITOR_ACTIONS.DRAFT,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Non tes permiso para editar este artigo');
  });

  it('omits blank titles on draft saves instead of injecting placeholder titles and derives a safe slug', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    vi.mocked(dbModule.createPublication).mockResolvedValue({
      data: { id: 'untitled-pub-1' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      title: { gl: '', es: '' },
      content: { gl: '<p>Borrador sen título</p>', es: '' },
      action: EDITOR_ACTIONS.DRAFT,
    });

    expect(result.success).toBe(true);
    expect(result.slug).toMatch(/^artigo-[a-z0-9]{6}$/);
    expect(dbModule.createPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        title: {},
        content: { gl: '<p>Borrador sen título</p>' },
      })
    );
  });

  it('saves a monolingual es-only publication, strips gl keys, syncs original_language, and derives slug from es', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('founder-1', USER_ROLES.FOUNDER)
    );

    vi.mocked(dbModule.createPublication).mockResolvedValue({
      data: { id: 'mono-es-1' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      language_mode: 'monolingual',
      original_language: 'es',
      title: { gl: 'Borrador galego descartado', es: 'Ensayo en Español' },
      subtitle: { gl: 'Sub GL', es: 'Sub ES' },
      content: { gl: '<p>Descartado</p>', es: '<p>Contenido en español</p>' },
      action: EDITOR_ACTIONS.PUBLISH,
      lang: 'es',
    });

    expect(result.success).toBe(true);
    expect(result.slug).toMatch(/^ensayo-en-espanol-[a-z0-9]{6}$/);
    expect(dbModule.createPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        original_language: 'es',
        title: { es: 'Ensayo en Español' },
        subtitle: { es: 'Sub ES' },
        content: { es: '<p>Contenido en español</p>' },
        status: PUBLICATION_STATUSES.PUBLISHED,
      })
    );
  });

  it('rejects monolingual publish when title or meaningful body is missing', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('founder-1', USER_ROLES.FOUNDER)
    );

    const result = await saveArticleAction({
      ...baseInput,
      language_mode: 'monolingual',
      original_language: 'gl',
      title: { gl: 'Título en Galego' },
      content: { gl: '<p><br></p>' },
      action: EDITOR_ACTIONS.PUBLISH,
      lang: 'gl',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Galego');
    expect(dbModule.createPublication).not.toHaveBeenCalled();
  });

  it('rejects bilingual submit-for-review when one language is incomplete', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    const result = await saveArticleAction({
      ...baseInput,
      language_mode: 'bilingual',
      original_language: 'gl',
      title: { gl: 'Título GL', es: '   ' },
      content: { gl: '<p>Contido GL</p>', es: '<p>Contenido ES</p>' },
      action: EDITOR_ACTIONS.SUBMIT_APPROVAL,
      lang: 'es',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Castellano');
    expect(dbModule.createPublication).not.toHaveBeenCalled();
  });

  it('rejects completely empty draft with localized error', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    const result = await saveArticleAction({
      ...baseInput,
      title: { gl: '  ', es: '' },
      content: { gl: '<p></p>', es: '<p>&nbsp;</p>' },
      action: EDITOR_ACTIONS.DRAFT,
      lang: 'gl',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('borrador');
    expect(dbModule.createPublication).not.toHaveBeenCalled();
  });

  it('returns localized Spanish error messages when lang is es', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(UNAUTH_SESSION);

    const result = await saveArticleAction({
      ...baseInput,
      lang: 'es',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No autorizado: sesión requerida');
  });

  it('persists show_index and strips legacy <nav data-type="article-index"> blocks before saving', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('founder-1', USER_ROLES.FOUNDER)
    );

    vi.mocked(dbModule.createPublication).mockResolvedValue({
      data: { id: 'pub-idx-1' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const dirtyHtml = '<nav data-type="article-index"><div>Old TOC</div></nav><h1>Primeira Sección</h1><p>Texto</p>';

    const result = await saveArticleAction({
      ...baseInput,
      content: { gl: dirtyHtml, es: dirtyHtml },
      show_index: true,
      action: EDITOR_ACTIONS.PUBLISH,
    });

    expect(result.success).toBe(true);
    expect(dbModule.createPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        show_index: true,
        content: {
          gl: '<h1>Primeira Sección</h1><p>Texto</p>',
          es: '<h1>Primeira Sección</h1><p>Texto</p>',
        },
      })
    );
  });

  it('rejects a zero-role user on create and update (fail-closed)', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('zero-1', [], [])
    );

    const createResult = await saveArticleAction(baseInput);
    expect(createResult.success).toBe(false);
    expect(createResult.error).toContain('Permisos insuficientes');
    expect(dbModule.createPublication).not.toHaveBeenCalled();

    const updateResult = await saveArticleAction({ ...baseInput, id: 'pub-1' });
    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toContain('Permisos insuficientes');
    expect(dbModule.updatePublication).not.toHaveBeenCalled();
  });

  it('gates creation strictly on publications:create rather than desk:access', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('desk-only-1', [PERMISSIONS.DESK_ACCESS])
    );

    const result = await saveArticleAction(baseInput);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Permisos insuficientes');
    expect(dbModule.createPublication).not.toHaveBeenCalled();
  });

  it('allows guest + member overlapping multi-role to submit for review but blocks direct publish', async () => {
    const multiPerms = resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]);
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('multi-gm-1', multiPerms, [USER_ROLES.GUEST, USER_ROLES.MEMBER])
    );

    const publishResult = await saveArticleAction({
      ...baseInput,
      action: EDITOR_ACTIONS.PUBLISH,
    });
    expect(publishResult.success).toBe(false);
    expect(publishResult.error).toContain('só os fundadores e administradores poden publicar');

    vi.mocked(dbModule.createPublication).mockResolvedValue({
      data: { id: 'multi-pub-1' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const submitResult = await saveArticleAction({
      ...baseInput,
      action: EDITOR_ACTIONS.SUBMIT_APPROVAL,
    });
    expect(submitResult.success).toBe(true);
    expect(dbModule.createPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PUBLICATION_STATUSES.IN_REVIEW,
        author_id: 'multi-gm-1',
      })
    );
  });

  it('allows founder + admin overlapping multi-role to directly publish', async () => {
    const faPerms = resolvePermissionsForRoles([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]);
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('fa-1', faPerms, [USER_ROLES.FOUNDER, USER_ROLES.ADMIN])
    );
    vi.mocked(dbModule.createPublication).mockResolvedValue({
      data: { id: 'fa-pub-1' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      action: EDITOR_ACTIONS.PUBLISH,
    });
    expect(result.success).toBe(true);
    expect(dbModule.createPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PUBLICATION_STATUSES.PUBLISHED,
      })
    );
  });

  it('blocks a member (publications:update_own only) from editing their own already-published article', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );
    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-own-published',
      slug: 'artigo-publicado-abc123',
      status: PUBLICATION_STATUSES.PUBLISHED,
      published_at: '2026-05-01T10:00:00Z',
      author: { id: 'member-1' },
    } as unknown as PublicationDetail);

    const result = await saveArticleAction({
      ...baseInput,
      id: 'pub-own-published',
      action: EDITOR_ACTIONS.DRAFT,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Non tes permiso para editar este artigo');
    expect(dbModule.updatePublication).not.toHaveBeenCalled();
  });

  it('allows publications:review-only user to approve or reject another author in_review submission, while blocking drafts and direct publish', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('reviewer-1', [PERMISSIONS.DESK_ACCESS, PERMISSIONS.PUBLICATIONS_REVIEW])
    );

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-in-review',
      slug: 'artigo-en-revision-abc123',
      status: PUBLICATION_STATUSES.IN_REVIEW,
      author: { id: 'guest-author-1' },
    } as unknown as PublicationDetail);
    vi.mocked(dbModule.updatePublication).mockResolvedValue({
      data: { id: 'pub-in-review' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const approveResult = await saveArticleAction({
      ...baseInput,
      id: 'pub-in-review',
      action: EDITOR_ACTIONS.APPROVE,
    });
    expect(approveResult.success).toBe(true);
    expect(dbModule.updatePublication).toHaveBeenCalledWith(
      'pub-in-review',
      expect.objectContaining({
        status: PUBLICATION_STATUSES.PUBLISHED,
        published_at: expect.any(String),
      })
    );

    const rejectResult = await saveArticleAction({
      ...baseInput,
      id: 'pub-in-review',
      action: EDITOR_ACTIONS.REJECT,
    });
    expect(rejectResult.success).toBe(true);
    expect(dbModule.updatePublication).toHaveBeenCalledWith(
      'pub-in-review',
      expect.objectContaining({
        status: PUBLICATION_STATUSES.DRAFT,
        published_at: null,
      })
    );

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-other-draft',
      slug: 'borrador-outro-abc123',
      status: PUBLICATION_STATUSES.DRAFT,
      author: { id: 'guest-author-1' },
    } as unknown as PublicationDetail);

    const draftEditResult = await saveArticleAction({
      ...baseInput,
      id: 'pub-other-draft',
      action: EDITOR_ACTIONS.DRAFT,
    });
    expect(draftEditResult.success).toBe(false);
    expect(draftEditResult.error).toContain('Non tes permiso para editar este artigo');
  });

  it('allows publications:publish-only user to publish own draft and edit own published, while blocking foreign in_review', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('publisher-1', [
        PERMISSIONS.DESK_ACCESS,
        PERMISSIONS.PUBLICATIONS_UPDATE_OWN,
        PERMISSIONS.PUBLICATIONS_PUBLISH,
      ])
    );

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-own-pub',
      slug: 'meu-publicado-abc123',
      status: PUBLICATION_STATUSES.PUBLISHED,
      published_at: '2026-05-01T10:00:00Z',
      author: { id: 'publisher-1' },
    } as unknown as PublicationDetail);
    vi.mocked(dbModule.updatePublication).mockResolvedValue({
      data: { id: 'pub-own-pub' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const ownPubEdit = await saveArticleAction({
      ...baseInput,
      id: 'pub-own-pub',
      action: EDITOR_ACTIONS.PUBLISH,
    });
    expect(ownPubEdit.success).toBe(true);

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-foreign-review',
      slug: 'alleo-revision-abc123',
      status: PUBLICATION_STATUSES.IN_REVIEW,
      author: { id: 'other-author' },
    } as unknown as PublicationDetail);

    const foreignReviewAttempt = await saveArticleAction({
      ...baseInput,
      id: 'pub-foreign-review',
      action: EDITOR_ACTIONS.APPROVE,
    });
    expect(foreignReviewAttempt.success).toBe(false);
    expect(foreignReviewAttempt.error).toContain('Non tes permiso para editar este artigo');
  });

  it('allows publications:update_any user to edit another author draft', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('maintainer-1', [PERMISSIONS.DESK_ACCESS, PERMISSIONS.PUBLICATIONS_UPDATE_ANY])
    );
    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-other-draft',
      slug: 'borrador-alleo-abc123',
      status: PUBLICATION_STATUSES.DRAFT,
      author: { id: 'other-author' },
    } as unknown as PublicationDetail);
    vi.mocked(dbModule.updatePublication).mockResolvedValue({
      data: { id: 'pub-other-draft' } as unknown as PublicationRow,
      error: null,
    });
    vi.mocked(dbModule.syncPublicationTagsBySlugs).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      id: 'pub-other-draft',
      action: EDITOR_ACTIONS.DRAFT,
    });
    expect(result.success).toBe(true);
  });
});

describe('fetchMoreArticlesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns publications from DAL successfully', async () => {
    const mockCards = [{ id: 'card-1', slug: 'artigo-1' }] as unknown as PublicationCardItem[];
    vi.mocked(dbModule.getPublicationCards).mockResolvedValue(mockCards);

    const result = await fetchMoreArticlesAction({ offset: 0, limit: 10 });
    expect(result.success).toBe(true);
    expect(result.publications).toEqual(mockCards);
  });

  it('handles errors cleanly and returns localized error message', async () => {
    vi.mocked(dbModule.getPublicationCards).mockRejectedValue(new Error('DB failure'));

    const result = await fetchMoreArticlesAction({ offset: 0, lang: 'es' });
    expect(result.success).toBe(false);
    expect(result.publications).toEqual([]);
    expect(result.error).toContain('Error al cargar más publicaciones');
  });
});

describe('updateArticleState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails if user is not authenticated', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(UNAUTH_SESSION);

    const result = await updateArticleState('pub-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Non autorizado');
  });

  it('fails if user is not an admin or founder', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('reader-1', USER_ROLES.MEMBER)
    );

    const result = await updateArticleState('pub-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(result.success).toBe(false);
    expect(result.error).toContain('só os fundadores e administradores poden publicar');
  });

  it('successfully updates publication status when authorized', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('admin-1', USER_ROLES.ADMIN)
    );
    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-1',
      status: PUBLICATION_STATUSES.IN_REVIEW,
      author: { id: 'author-2' },
    } as unknown as PublicationDetail);
    vi.mocked(dbModule.updatePublicationStatus).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await updateArticleState('pub-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(result.success).toBe(true);
    expect(dbModule.updatePublicationStatus).toHaveBeenCalledWith('pub-1', PUBLICATION_STATUSES.PUBLISHED);
  });

  it('rejects zero-role and guest + member overlapping multi-role in updateArticleState', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('zero-1', [], [])
    );
    const zeroRes = await updateArticleState('pub-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(zeroRes.success).toBe(false);
    expect(zeroRes.error).toContain('só os fundadores e administradores poden publicar');

    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession(
        'gm-1',
        resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]),
        [USER_ROLES.GUEST, USER_ROLES.MEMBER]
      )
    );
    const gmRes = await updateArticleState('pub-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(gmRes.success).toBe(false);
    expect(dbModule.updatePublicationStatus).not.toHaveBeenCalled();
  });

  it('allows publications:review to transition in_review publications but rejects non-in_review publications', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('reviewer-1', [PERMISSIONS.PUBLICATIONS_REVIEW])
    );
    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-rev-1',
      status: PUBLICATION_STATUSES.IN_REVIEW,
      author: { id: 'author-2' },
    } as unknown as PublicationDetail);
    vi.mocked(dbModule.updatePublicationStatus).mockResolvedValue({
      success: true,
      error: null,
    });

    const approveRes = await updateArticleState('pub-rev-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(approveRes.success).toBe(true);

    const rejectRes = await updateArticleState('pub-rev-1', PUBLICATION_STATUSES.DRAFT);
    expect(rejectRes.success).toBe(true);

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-draft-1',
      status: PUBLICATION_STATUSES.DRAFT,
      author: { id: 'author-2' },
    } as unknown as PublicationDetail);

    const draftRes = await updateArticleState('pub-draft-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(draftRes.success).toBe(false);
    expect(draftRes.error).toContain('só os fundadores e administradores poden publicar');
  });

  it('allows publications:publish on own publications while blocking foreign in_review', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('pub-user-1', [PERMISSIONS.PUBLICATIONS_PUBLISH])
    );
    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-own-1',
      status: PUBLICATION_STATUSES.DRAFT,
      author: { id: 'pub-user-1' },
    } as unknown as PublicationDetail);
    vi.mocked(dbModule.updatePublicationStatus).mockResolvedValue({
      success: true,
      error: null,
    });

    const ownRes = await updateArticleState('pub-own-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(ownRes.success).toBe(true);

    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-other-rev',
      status: PUBLICATION_STATUSES.IN_REVIEW,
      author: { id: 'other-author' },
    } as unknown as PublicationDetail);

    const foreignRes = await updateArticleState('pub-other-rev', PUBLICATION_STATUSES.PUBLISHED);
    expect(foreignRes.success).toBe(false);
    expect(foreignRes.error).toContain('só os fundadores e administradores poden publicar');
  });

  it('allows founder + admin multi-role to transition any publication state', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession(
        'fa-1',
        resolvePermissionsForRoles([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]),
        [USER_ROLES.FOUNDER, USER_ROLES.ADMIN]
      )
    );
    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-any-1',
      status: PUBLICATION_STATUSES.PUBLISHED,
      author: { id: 'other-author' },
    } as unknown as PublicationDetail);
    vi.mocked(dbModule.updatePublicationStatus).mockResolvedValue({
      success: true,
      error: null,
    });

    const res = await updateArticleState('pub-any-1', PUBLICATION_STATUSES.DRAFT);
    expect(res.success).toBe(true);
  });

  it('rejects bare publications:update_any (without publications:publish) when transitioning draft to published, while allowing draft transition', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession('editor-any-1', [PERMISSIONS.PUBLICATIONS_UPDATE_ANY])
    );
    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-draft-2',
      status: PUBLICATION_STATUSES.DRAFT,
      author: { id: 'other-author' },
    } as unknown as PublicationDetail);
    vi.mocked(dbModule.updatePublicationStatus).mockResolvedValue({
      success: true,
      error: null,
    });

    const publishRes = await updateArticleState('pub-draft-2', PUBLICATION_STATUSES.PUBLISHED);
    expect(publishRes.success).toBe(false);
    expect(publishRes.error).toContain('só os fundadores e administradores poden publicar');
    expect(dbModule.updatePublicationStatus).not.toHaveBeenCalled();

    // Non-published transition (e.g., in_review -> draft) remains allowed for publications:update_any
    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-rev-2',
      status: PUBLICATION_STATUSES.IN_REVIEW,
      author: { id: 'other-author' },
    } as unknown as PublicationDetail);

    const rejectRes = await updateArticleState('pub-rev-2', PUBLICATION_STATUSES.DRAFT);
    expect(rejectRes.success).toBe(true);
    expect(dbModule.updatePublicationStatus).toHaveBeenCalledWith('pub-rev-2', PUBLICATION_STATUSES.DRAFT);
  });
});

describe('deleteArticleAction', () => {
  const mockSsrClient = { storage: {} } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbModule.getPublicationById).mockResolvedValue(null);
    vi.mocked(supabaseServerModule.createClient).mockResolvedValue(mockSsrClient);
    vi.mocked(storageModule.sweepPublicationStorageFolder).mockResolvedValue(undefined);
    vi.mocked(storageModule.cleanupPublicationImages).mockResolvedValue(undefined);
  });

  it('rejects unauthenticated callers without touching DB or storage', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(UNAUTH_SESSION);

    const result = await deleteArticleAction('pub-123', 'gl');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Non autorizado');
    expect(dbModule.deletePublication).not.toHaveBeenCalled();
    expect(storageModule.sweepPublicationStorageFolder).not.toHaveBeenCalled();
    expect(storageModule.cleanupPublicationImages).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('deletes the DB row first via the authenticated SSR client and sweeps storage + legacy assets only after DB deletion succeeds', async () => {
    const callOrder: string[] = [];

    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    vi.mocked(dbModule.getPublicationAssetsForCleanup).mockImplementation(async () => {
      callOrder.push('fetchAssets');
      return {
        author_id: 'member-1',
        cover_image_url: 'https://example.supabase.co/storage/v1/object/public/media/publications/pub-123/cover-1.webp',
        content: {
          gl: '<p><img src="https://example.supabase.co/storage/v1/object/public/media/publications/pub-123/inline/gl.webp" /></p>',
          es: '<p><img src="https://example.supabase.co/storage/v1/object/public/media/publications/pub-123/inline/es.webp" /></p>',
        },
      };
    });

    vi.mocked(dbModule.deletePublication).mockImplementation(async () => {
      callOrder.push('deleteDb');
      return { success: true, error: null };
    });

    vi.mocked(storageModule.sweepPublicationStorageFolder).mockImplementation(async () => {
      callOrder.push('sweepFolder');
    });

    vi.mocked(storageModule.cleanupPublicationImages).mockImplementation(async () => {
      callOrder.push('cleanupLegacy');
    });

    const result = await deleteArticleAction('pub-123', 'es');

    expect(result).toEqual({ success: true });
    expect(dbModule.getPublicationAssetsForCleanup).toHaveBeenCalledWith('pub-123', mockSsrClient);
    expect(dbModule.deletePublication).toHaveBeenCalledWith('pub-123', mockSsrClient);
    expect(callOrder).toEqual(['fetchAssets', 'deleteDb', 'sweepFolder', 'cleanupLegacy']);
    expect(storageModule.sweepPublicationStorageFolder).toHaveBeenCalledWith(expect.anything(), 'pub-123');
    expect(storageModule.cleanupPublicationImages).toHaveBeenCalledWith(expect.anything(), {
      coverUrl: 'https://example.supabase.co/storage/v1/object/public/media/publications/pub-123/cover-1.webp',
      contentGl: '<p><img src="https://example.supabase.co/storage/v1/object/public/media/publications/pub-123/inline/gl.webp" /></p>',
      contentEs: '<p><img src="https://example.supabase.co/storage/v1/object/public/media/publications/pub-123/inline/es.webp" /></p>',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/gl');
    expect(revalidatePath).toHaveBeenCalledWith('/gl/articulos');
    expect(revalidatePath).toHaveBeenCalledWith('/gl/escritorio');
    expect(revalidatePath).toHaveBeenCalledWith('/es');
    expect(revalidatePath).toHaveBeenCalledWith('/es/articulos');
    expect(revalidatePath).toHaveBeenCalledWith('/es/escritorio');
  });

  it('performs zero storage mutations and returns a localized error when DB deletion is blocked by RLS or fails', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    vi.mocked(dbModule.getPublicationAssetsForCleanup).mockResolvedValue({
      author_id: 'member-1',
      cover_image_url: 'https://example.supabase.co/storage/v1/object/public/media/publications/pub-published/cover.webp',
      content: { gl: '', es: '' },
    });

    vi.mocked(dbModule.deletePublication).mockResolvedValue({
      success: false,
      error: new Error('RLS blocked deletion or row not found'),
    });

    const result = await deleteArticleAction('pub-published', 'es');

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(storageModule.sweepPublicationStorageFolder).not.toHaveBeenCalled();
    expect(storageModule.cleanupPublicationImages).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('filters out foreign publication URLs, user avatars, and _orphans before privileged cleanup', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    vi.mocked(dbModule.getPublicationAssetsForCleanup).mockResolvedValue({
      author_id: 'member-1',
      cover_image_url: 'https://example.supabase.co/storage/v1/object/public/media/publications/other-pub/cover.webp',
      content: {
        gl: [
          '<p><img src="https://example.supabase.co/storage/v1/object/public/media/users/member-1/avatar.webp" /></p>',
          '<p><img src="https://example.supabase.co/storage/v1/object/public/media/_orphans/old.webp" /></p>',
          '<p><img src="https://example.supabase.co/storage/v1/object/public/media/portadas/other-author/cover.webp" /></p>',
          '<p><img src="https://example.supabase.co/storage/v1/object/public/media/publications/covers/member-1/owned-legacy.webp" /></p>',
        ].join(''),
        es: '<p><img src="https://example.supabase.co/storage/v1/object/public/media/publications/pub-other/inline/fig.webp" /></p>',
      },
    });

    vi.mocked(dbModule.deletePublication).mockResolvedValue({ success: true, error: null });

    const result = await deleteArticleAction('pub-123', 'gl');

    expect(result).toEqual({ success: true });
    expect(storageModule.cleanupPublicationImages).toHaveBeenCalledTimes(1);
    expect(storageModule.cleanupPublicationImages).toHaveBeenCalledWith(expect.anything(), {
      coverUrl: null,
      contentGl:
        '<p></p><p></p><p></p><p><img src="https://example.supabase.co/storage/v1/object/public/media/publications/covers/member-1/owned-legacy.webp" /></p>',
      contentEs: null,
    });
  });

  it('skips cleanupPublicationImages completely when draft only references non-owned URLs', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    vi.mocked(dbModule.getPublicationAssetsForCleanup).mockResolvedValue({
      author_id: 'member-1',
      cover_image_url: 'https://example.supabase.co/storage/v1/object/public/media/users/victim-1/avatar.webp',
      content: {
        gl: '<p><img src="https://example.supabase.co/storage/v1/object/public/media/publications/other-pub/inline/fig.webp" /></p>',
        es: '<p><img src="https://example.supabase.co/storage/v1/object/public/imagenes-articulos/portadas/flat-legacy.webp" /></p>',
      },
    });

    vi.mocked(dbModule.deletePublication).mockResolvedValue({ success: true, error: null });

    const result = await deleteArticleAction('pub-123', 'gl');

    expect(result).toEqual({ success: true });
    expect(storageModule.sweepPublicationStorageFolder).toHaveBeenCalledWith(expect.anything(), 'pub-123');
    expect(storageModule.cleanupPublicationImages).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalled();
  });

  it('returns success and revalidates paths even when storage sweep or legacy cleanup throws after DB deletion', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makeAuthSession('member-1', USER_ROLES.MEMBER)
    );

    vi.mocked(dbModule.getPublicationAssetsForCleanup).mockResolvedValue({
      author_id: 'member-1',
      cover_image_url: 'https://example.supabase.co/storage/v1/object/public/media/publications/pub-123/cover.webp',
      content: { gl: '', es: '' },
    });

    vi.mocked(dbModule.deletePublication).mockResolvedValue({ success: true, error: null });
    vi.mocked(storageModule.sweepPublicationStorageFolder).mockRejectedValue(new Error('Sweep boom'));
    vi.mocked(storageModule.cleanupPublicationImages).mockRejectedValue(new Error('Cleanup boom'));

    const result = await deleteArticleAction('pub-123', 'gl');

    expect(result).toEqual({ success: true });
    expect(storageModule.sweepPublicationStorageFolder).toHaveBeenCalled();
    expect(storageModule.cleanupPublicationImages).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith('/gl');
    expect(revalidatePath).toHaveBeenCalledWith('/es');

    consoleErrorSpy.mockRestore();
  });

  it('rejects reader and zero-role users from deleting without touching DB or storage', async () => {
    for (const session of [
      makeAuthSession('reader-1', USER_ROLES.READER),
      makePermissionSession('zero-1', [], []),
    ]) {
      vi.clearAllMocks();
      vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(session);

      const res = await deleteArticleAction('pub-123', 'gl');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Permisos insuficientes');
      expect(dbModule.deletePublication).not.toHaveBeenCalled();
      expect(storageModule.sweepPublicationStorageFolder).not.toHaveBeenCalled();
    }
  });

  it('blocks publications:delete_own (guest + member) from deleting own published or foreign draft articles', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession(
        'gm-1',
        resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]),
        [USER_ROLES.GUEST, USER_ROLES.MEMBER]
      )
    );

    vi.mocked(dbModule.getPublicationAssetsForCleanup).mockResolvedValue({
      author_id: 'gm-1',
      cover_image_url: null,
      content: { gl: '', es: '' },
    });
    vi.mocked(dbModule.getPublicationById).mockResolvedValue({
      id: 'pub-own-pub',
      status: PUBLICATION_STATUSES.PUBLISHED,
      author: { id: 'gm-1' },
    } as unknown as PublicationDetail);

    const ownPublishedRes = await deleteArticleAction('pub-own-pub', 'gl');
    expect(ownPublishedRes.success).toBe(false);
    expect(dbModule.deletePublication).not.toHaveBeenCalled();

    vi.mocked(dbModule.getPublicationAssetsForCleanup).mockResolvedValue({
      author_id: 'other-author',
      cover_image_url: null,
      content: { gl: '', es: '' },
    });
    const foreignDraftRes = await deleteArticleAction('pub-other-draft', 'gl');
    expect(foreignDraftRes.success).toBe(false);
    expect(dbModule.deletePublication).not.toHaveBeenCalled();
  });

  it('allows publications:delete_any (founder + admin) to delete another author published article', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(
      makePermissionSession(
        'fa-1',
        resolvePermissionsForRoles([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]),
        [USER_ROLES.FOUNDER, USER_ROLES.ADMIN]
      )
    );
    vi.mocked(dbModule.getPublicationAssetsForCleanup).mockResolvedValue({
      author_id: 'other-author',
      cover_image_url: null,
      content: { gl: '', es: '' },
    });
    vi.mocked(dbModule.deletePublication).mockResolvedValue({ success: true, error: null });

    const res = await deleteArticleAction('pub-other-pub', 'gl');
    expect(res).toEqual({ success: true });
    expect(dbModule.deletePublication).toHaveBeenCalledWith('pub-other-pub', mockSsrClient);
    expect(storageModule.sweepPublicationStorageFolder).toHaveBeenCalledWith(expect.anything(), 'pub-other-pub');
  });
});
