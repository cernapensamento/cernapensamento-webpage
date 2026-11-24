import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveArticleAction,
  fetchMoreArticlesAction,
  updateArticleState,
} from './articles';
import { USER_ROLES, PUBLICATION_STATUSES, EDITOR_ACTIONS } from '@/lib/db/schema';
import * as authModule from '@/lib/auth';
import * as dbModule from '@/lib/db';
import type { User } from '@supabase/supabase-js';
import type { ProfileRow, PublicationRow, PublicationDetail, PublicationCardItem } from '@/lib/db';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    createPublication: vi.fn(),
    updatePublication: vi.fn(),
    getPublicationById: vi.fn(),
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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: null,
      profile: null,
      role: null,
    });

    const result = await saveArticleAction(baseInput);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Non autorizado');
  });

  it('fails if user has reader role', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'reader-1' } as unknown as User,
      profile: { id: 'reader-1', role: USER_ROLES.READER } as unknown as ProfileRow,
      role: USER_ROLES.READER,
    });

    const result = await saveArticleAction(baseInput);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Permisos insuficientes');
  });

  it('rejects direct publish if user role is not admin or founder', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'member-1' } as unknown as User,
      profile: { id: 'member-1', role: USER_ROLES.MEMBER } as unknown as ProfileRow,
      role: USER_ROLES.MEMBER,
    });

    const result = await saveArticleAction({
      ...baseInput,
      action: EDITOR_ACTIONS.PUBLISH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('só os fundadores e administradores poden publicar');
  });

  it('creates a draft publication successfully for a member', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'member-1' } as unknown as User,
      profile: { id: 'member-1', role: USER_ROLES.MEMBER } as unknown as ProfileRow,
      role: USER_ROLES.MEMBER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'admin-1' } as unknown as User,
      profile: { id: 'admin-1', role: USER_ROLES.ADMIN } as unknown as ProfileRow,
      role: USER_ROLES.ADMIN,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'author-1' } as unknown as User,
      profile: { id: 'author-1', role: USER_ROLES.FOUNDER } as unknown as ProfileRow,
      role: USER_ROLES.FOUNDER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'author-1' } as unknown as User,
      profile: { id: 'author-1', role: USER_ROLES.FOUNDER } as unknown as ProfileRow,
      role: USER_ROLES.FOUNDER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'author-1' } as unknown as User,
      profile: { id: 'author-1', role: USER_ROLES.FOUNDER } as unknown as ProfileRow,
      role: USER_ROLES.FOUNDER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'stranger-1' } as unknown as User,
      profile: { id: 'stranger-1', role: USER_ROLES.MEMBER } as unknown as ProfileRow,
      role: USER_ROLES.MEMBER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'member-1' } as unknown as User,
      profile: { id: 'member-1', role: USER_ROLES.MEMBER } as unknown as ProfileRow,
      role: USER_ROLES.MEMBER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'founder-1' } as unknown as User,
      profile: { id: 'founder-1', role: USER_ROLES.FOUNDER } as unknown as ProfileRow,
      role: USER_ROLES.FOUNDER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'founder-1' } as unknown as User,
      profile: { id: 'founder-1', role: USER_ROLES.FOUNDER } as unknown as ProfileRow,
      role: USER_ROLES.FOUNDER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'member-1' } as unknown as User,
      profile: { id: 'member-1', role: USER_ROLES.MEMBER } as unknown as ProfileRow,
      role: USER_ROLES.MEMBER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'member-1' } as unknown as User,
      profile: { id: 'member-1', role: USER_ROLES.MEMBER } as unknown as ProfileRow,
      role: USER_ROLES.MEMBER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: null,
      profile: null,
      role: null,
    });

    const result = await saveArticleAction({
      ...baseInput,
      lang: 'es',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No autorizado: sesión requerida');
  });

  it('persists show_index and strips legacy <nav data-type="article-index"> blocks before saving', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'founder-1' } as unknown as User,
      profile: { id: 'founder-1', role: USER_ROLES.FOUNDER } as unknown as ProfileRow,
      role: USER_ROLES.FOUNDER,
    });

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
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: null,
      profile: null,
      role: null,
    });

    const result = await updateArticleState('pub-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Non autorizado');
  });

  it('fails if user is not an admin or founder', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'reader-1' } as unknown as User,
      profile: { id: 'reader-1', role: USER_ROLES.MEMBER } as unknown as ProfileRow,
      role: USER_ROLES.MEMBER,
    });

    const result = await updateArticleState('pub-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(result.success).toBe(false);
    expect(result.error).toContain('só os fundadores e administradores poden publicar');
  });

  it('successfully updates publication status when authorized', async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: { id: 'admin-1' } as unknown as User,
      profile: { id: 'admin-1', role: USER_ROLES.ADMIN } as unknown as ProfileRow,
      role: USER_ROLES.ADMIN,
    });
    vi.mocked(dbModule.updatePublicationStatus).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await updateArticleState('pub-1', PUBLICATION_STATUSES.PUBLISHED);
    expect(result.success).toBe(true);
    expect(dbModule.updatePublicationStatus).toHaveBeenCalledWith('pub-1', PUBLICATION_STATUSES.PUBLISHED);
  });
});
