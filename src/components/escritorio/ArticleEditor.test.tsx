import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArticleEditor from './ArticleEditor';
import { parseDraft, serializeDraft } from './articleEditorUtils';
import * as storage from '@/lib/storage';
import * as articlesActions from '@/actions/articles';

vi.mock('@/actions/articles', () => ({
  saveArticleAction: vi.fn(),
}));

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'usr-test' } } });

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null }),
        }),
      }),
    }),
  }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastWarning = vi.fn();
const mockConfirm = vi.fn().mockResolvedValue(true);
const mockPrompt = vi.fn().mockResolvedValue('test');

vi.mock('@/components/ui/FeedbackProvider', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
  }),
  useConfirm: () => mockConfirm,
  usePrompt: () => mockPrompt,
}));

describe('ArticleEditor Save Flow and Storage Garbage Collection', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let removeStorageImagesSpy: any;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockResolvedValue(true);
    mockPrompt.mockResolvedValue('test');
    removeStorageImagesSpy = vi.spyOn(storage, 'removeStorageImages').mockResolvedValue();
    mockStorage = {};

    const localStorageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    global.localStorage = localStorageMock as unknown as Storage;
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('does NOT delete images or clear draft if onSave fails (returns false)', async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    const draftKey = 'cerna_draft_art-1';
    window.localStorage.setItem(draftKey, JSON.stringify({ tituloGl: 'Borrador pendente' }));

    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-1',
          title: { gl: 'Título', es: 'Título' },
          content: {
            gl: '<p><img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/inline/u1/old-inline.webp" /></p>',
            es: '',
          },
          cover_image_url: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/u1/old-cover.webp',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    // Click "Borrador" button to trigger handleSubmit('draft')
    const draftButton = screen.getByRole('button', { name: /borrador/i });
    fireEvent.click(draftButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    // Failed save: removeStorageImages must NOT be called
    expect(removeStorageImagesSpy).not.toHaveBeenCalled();
    // Draft must NOT be cleared
    expect(window.localStorage.getItem(draftKey)).not.toBeNull();
  });

  it('does NOT delete images or clear draft if onSave throws an error', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'));
    const draftKey = 'cerna_draft_art-2';
    window.localStorage.setItem(draftKey, JSON.stringify({ tituloGl: 'Borrador 2' }));

    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-2',
          title: { gl: 'Título', es: 'Título' },
          cover_image_url: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/u1/old-cover.webp',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    const draftButton = screen.getByRole('button', { name: /borrador/i });
    fireEvent.click(draftButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    expect(removeStorageImagesSpy).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(draftKey)).not.toBeNull();
  });

  it('calls removeStorageImages and clears draft only AFTER onSave succeeds when cover is changed', async () => {
    let saveCompleted = false;
    const onSave = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      saveCompleted = true;
      return true;
    });

    vi.spyOn(storage, 'uploadStorageImage').mockResolvedValue({
      publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/u1/new-cover.webp',
      path: 'publications/covers/u1/new-cover.webp',
      width: 1200,
      height: 800,
    });

    removeStorageImagesSpy.mockImplementation(async () => {
      // At the moment removeStorageImages is called, onSave must already have completed!
      expect(saveCompleted).toBe(true);
    });

    const draftKey = 'cerna_draft_art-3';
    window.localStorage.setItem(draftKey, JSON.stringify({ tituloGl: 'Borrador 3' }));

    const { container } = render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-3',
          title: { gl: 'Título', es: 'Título' },
          cover_image_url: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/u1/old-cover.webp',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    // Simulate uploading a new cover image
    const [coverFileInput] = container.querySelectorAll('input[type="file"]');
    const newFile = new File(['fake-image'], 'new-cover.png', { type: 'image/png' });
    fireEvent.change(coverFileInput, { target: { files: [newFile] } });

    // Wait for the new cover image upload to complete
    await waitFor(() => {
      expect(storage.uploadStorageImage).toHaveBeenCalled();
    });

    const draftButton = screen.getByRole('button', { name: /borrador/i });
    fireEvent.click(draftButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(removeStorageImagesSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining(['publications/covers/u1/old-cover.webp'])
      );
    });

    expect(window.localStorage.getItem(draftKey)).toBeNull();
  });

  it('deletes intermediate unused cover uploads and previous cover when replaced multiple times', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    const uploadSpy = vi.spyOn(storage, 'uploadStorageImage')
      .mockResolvedValueOnce({
        publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/u1/intermediate-cover.webp',
        path: 'publications/covers/u1/intermediate-cover.webp',
        width: 1200,
        height: 800,
      })
      .mockResolvedValueOnce({
        publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/u1/final-cover.webp',
        path: 'publications/covers/u1/final-cover.webp',
        width: 1200,
        height: 800,
      });

    const { container } = render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-4',
          title: { gl: 'Título', es: 'Título' },
          cover_image_url: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/u1/initial-cover.webp',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    const [coverFileInput] = container.querySelectorAll('input[type="file"]');

    // First cover change (intermediate)
    fireEvent.change(coverFileInput, { target: { files: [new File(['img1'], 'img1.png', { type: 'image/png' })] } });
    await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(1));

    // Second cover change (final)
    fireEvent.change(coverFileInput, { target: { files: [new File(['img2'], 'img2.png', { type: 'image/png' })] } });
    await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(2));

    const draftButton = screen.getByRole('button', { name: /borrador/i });
    fireEvent.click(draftButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    await waitFor(() => {
      // Both initial cover AND intermediate cover should be deleted, but NOT final cover
      expect(removeStorageImagesSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          'publications/covers/u1/initial-cover.webp',
          'publications/covers/u1/intermediate-cover.webp',
        ])
      );
      const calledPaths = removeStorageImagesSpy.mock.calls[0][1];
      expect(calledPaths).not.toContain('publications/covers/u1/final-cover.webp');
    });
  });

  it('toggles declarative showIndex for live writing preview, publication preview modal, and save payload', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-toc-1',
          title: { gl: 'Ensaio con Índice', es: 'Ensayo con Índice' },
          content: {
            gl: '<h1>Primeira Parte</h1><p>Texto inicial.</p><h2>Subparte</h2><p>Máis texto.</p>',
            es: '<h1>Primera Parte</h1><p>Texto inicial.</p>',
          },
          show_index: false,
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    const tocButton = screen.getByRole('button', { name: /táboa de contidos/i });
    expect(tocButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('switch', { name: /índice automático/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /índice do artigo/i })).not.toBeInTheDocument();

    // Turn index on via top toolbar and confirm live writing preview appears above the editor body
    fireEvent.click(tocButton);
    expect(tocButton).toHaveAttribute('aria-pressed', 'true');
    const liveNav = await screen.findByRole('navigation', { name: /índice do artigo/i });
    expect(liveNav).toHaveTextContent('Primeira Parte');
    expect(liveNav).toHaveTextContent('Subparte');

    // Open preview modal and confirm coupled index also appears in modal preview
    const previewButton = screen.getByRole('button', { name: /vista previa/i });
    fireEvent.click(previewButton);
    const navLandmarks = await screen.findAllByRole('navigation', { name: /índice do artigo/i });
    expect(navLandmarks.length).toBeGreaterThanOrEqual(2);

    // Close preview modal and save draft
    fireEvent.click(screen.getByRole('button', { name: /volver ao editor/i }));
    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          show_index: true,
        }),
        'draft'
      );
    });
    const savedPayload = onSave.mock.calls[0][0];
    expect(savedPayload.content?.gl).not.toContain('data-type="article-index"');
  });

  it('infers showIndex=true and strips legacy embedded <nav data-type="article-index"> on load and save', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-legacy-1',
          title: { gl: 'Artigo Legado', es: 'Artículo Legado' },
          content: {
            gl: '<nav data-type="article-index"><div>Old</div></nav><h1>Sección Legada</h1><p>Contido.</p>',
            es: '',
          },
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    const tocButton = screen.getByRole('button', { name: /táboa de contidos/i });
    expect(tocButton).toHaveAttribute('aria-pressed', 'true');
    const liveNav = await screen.findByRole('navigation', { name: /índice do artigo/i });
    expect(liveNav).toHaveTextContent('Sección Legada');

    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const savedPayload = onSave.mock.calls[0][0];
    expect(savedPayload.show_index).toBe(true);
    expect(savedPayload.content?.gl).not.toContain('data-type="article-index"');
  });

  it('switches locale tabs dynamically and saves updated localized titles', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-i18n-1',
          title: { gl: 'Título Galego', es: 'Título Español' },
          content: { gl: '<p>Contido</p>', es: '<p>Contenido</p>' },
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    const esTab = screen.getByRole('button', { name: /^castellano$/i });
    fireEvent.click(esTab);

    const titleInput = screen.getByDisplayValue('Título Español');
    fireEvent.change(titleInput, { target: { value: 'Título Actualizado ES' } });

    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: { gl: 'Título Galego', es: 'Título Actualizado ES' },
        }),
        'draft'
      );
    });
  });

  it('parses both canonical and legacy localStorage drafts cleanly', () => {
    const legacyParsed = parseDraft(JSON.stringify({ tituloGl: 'Borrador legado', tipo: 'essay' }));
    expect(legacyParsed?.titles).toEqual({ gl: 'Borrador legado' });
    expect(legacyParsed?.type).toBe('essay');

    const serialized = serializeDraft({
      title: { gl: 'Novo', es: 'Nuevo' },
      subtitle: { gl: 'Sub', es: 'Sub ES' },
      content: { gl: '<p>A</p>', es: '<p>B</p>' },
      cover_image_url: '',
      tags: ['etica'],
      type: 'article',
      original_language: 'gl',
      show_index: true,
    });
    const canonicalParsed = parseDraft(serialized);
    expect(canonicalParsed?.titles).toEqual({ gl: 'Novo', es: 'Nuevo' });
    expect(canonicalParsed?.tags).toEqual(['etica']);
    expect(canonicalParsed?.showIndex).toBe(true);
  });

  it('passes publicationId to uploadStorageImage for cover and inline uploads on an existing publication', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const uploadSpy = vi.spyOn(storage, 'uploadStorageImage')
      .mockResolvedValueOnce({
        publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-existing-42/cover-123.webp',
        path: 'publications/pub-existing-42/cover-123.webp',
        width: 1200,
        height: 800,
      })
      .mockResolvedValueOnce({
        publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-existing-42/inline/fig-123.webp',
        path: 'publications/pub-existing-42/inline/fig-123.webp',
        width: 800,
        height: 600,
      });

    const { container } = render(
      <ArticleEditor
        mode="edit"
        userRole="admin"
        initialData={{
          id: 'pub-existing-42',
          title: { gl: 'Artigo doutra autora', es: 'Artículo de otra autora' },
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    const [coverFileInput, inlineFileInput] = container.querySelectorAll('input[type="file"]');

    fireEvent.change(coverFileInput, {
      target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
    });

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: storage.STORAGE_CATEGORIES.PUBLICATION_COVER,
          publicationId: 'pub-existing-42',
        })
      );
    });

    fireEvent.change(inlineFileInput, {
      target: { files: [new File(['inline'], 'figure.png', { type: 'image/png' })] },
    });

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: storage.STORAGE_CATEGORIES.PUBLICATION_INLINE,
          publicationId: 'pub-existing-42',
          originalFilename: 'figure.png',
        })
      );
    });

    expect(articlesActions.saveArticleAction).not.toHaveBeenCalled();
  });

  it('lazily creates a draft via saveArticleAction, updates URL with replaceState, and reuses publicationId on subsequent uploads', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onDraftCreated = vi.fn();
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    vi.mocked(articlesActions.saveArticleAction).mockResolvedValue({
      success: true,
      id: 'pub-lazy-99',
      slug: 'sen-titulo-99',
    });

    const uploadSpy = vi.spyOn(storage, 'uploadStorageImage')
      .mockResolvedValueOnce({
        publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-lazy-99/cover-1.webp',
        path: 'publications/pub-lazy-99/cover-1.webp',
        width: 1200,
        height: 800,
      })
      .mockResolvedValueOnce({
        publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-lazy-99/inline/chart-1.webp',
        path: 'publications/pub-lazy-99/inline/chart-1.webp',
        width: 800,
        height: 600,
      });

    const { container } = render(
      <ArticleEditor
        mode="create"
        onSave={onSave}
        onDraftCreated={onDraftCreated}
        isPublishing={false}
      />
    );

    const [coverFileInput, inlineFileInput] = container.querySelectorAll('input[type="file"]');

    // First upload: cover triggers lazy draft creation
    fireEvent.change(coverFileInput, {
      target: { files: [new File(['cover'], 'cover.jpg', { type: 'image/jpeg' })] },
    });

    await waitFor(() => {
      expect(articlesActions.saveArticleAction).toHaveBeenCalledTimes(1);
      expect(articlesActions.saveArticleAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'draft',
          lang: 'gl',
        })
      );
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/gl/escritorio/editar/sen-titulo-99');
      expect(onDraftCreated).toHaveBeenCalledWith({ id: 'pub-lazy-99', slug: 'sen-titulo-99' });
      expect(uploadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: storage.STORAGE_CATEGORIES.PUBLICATION_COVER,
          publicationId: 'pub-lazy-99',
        })
      );
    });

    // Second upload: inline reuses bound publicationId without calling saveArticleAction again
    fireEvent.change(inlineFileInput, {
      target: { files: [new File(['inline'], 'chart.png', { type: 'image/png' })] },
    });

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: storage.STORAGE_CATEGORIES.PUBLICATION_INLINE,
          publicationId: 'pub-lazy-99',
          originalFilename: 'chart.png',
        })
      );
    });
    expect(articlesActions.saveArticleAction).toHaveBeenCalledTimes(1);

    replaceStateSpy.mockRestore();
  });

  it('surfaces error toast and aborts upload without calling uploadStorageImage when lazy draft creation fails (e.g. Guest Author quota)', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    const uploadSpy = vi.spyOn(storage, 'uploadStorageImage');

    vi.mocked(articlesActions.saveArticleAction).mockResolvedValue({
      success: false,
      error: 'Alcanzaches o límite anual de publicacións para autores convidados.',
    });

    const { container } = render(
      <ArticleEditor
        mode="create"
        userRole="guest"
        onSave={onSave}
        isPublishing={false}
      />
    );

    const [coverFileInput] = container.querySelectorAll('input[type="file"]');
    fireEvent.change(coverFileInput, {
      target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
    });

    await waitFor(() => {
      expect(articlesActions.saveArticleAction).toHaveBeenCalledTimes(1);
      expect(mockToastError).toHaveBeenCalledWith(
        'Alcanzaches o límite anual de publicacións para autores convidados.'
      );
    });

    expect(uploadSpy).not.toHaveBeenCalled();
    expect(replaceStateSpy).not.toHaveBeenCalled();

    replaceStateSpy.mockRestore();
  });

  it('cleans up superseded cover and removed inline image after save succeeds for a monolingual publication', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    vi.spyOn(storage, 'uploadStorageImage').mockResolvedValue({
      publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-mono-1/cover-new.webp',
      path: 'publications/pub-mono-1/cover-new.webp',
      width: 1200,
      height: 800,
    });

    const { container } = render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'pub-mono-1',
          title: { gl: 'Ensaio Monolingüe', es: '' },
          content: {
            gl: '<p>Texto</p><p><img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-mono-1/inline/removed-fig.webp" /></p>',
            es: '',
          },
          cover_image_url: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-mono-1/cover-old.webp',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    // Clear content to remove the inline image, then upload a new cover
    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Ensaio Monolingüe')).not.toBeInTheDocument();
    });

    const [coverFileInput] = container.querySelectorAll('input[type="file"]');
    fireEvent.change(coverFileInput, {
      target: { files: [new File(['new-cover'], 'new-cover.png', { type: 'image/png' })] },
    });

    await waitFor(() => {
      expect(storage.uploadStorageImage).toHaveBeenCalledWith(
        expect.objectContaining({ publicationId: 'pub-mono-1' })
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(removeStorageImagesSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          'publications/pub-mono-1/cover-old.webp',
          'publications/pub-mono-1/inline/removed-fig.webp',
        ])
      );
    });
  });

  it('migrates cached draft from _new key to entity key when lazy publicationId is created, and cleans old key only when setItem succeeds', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    vi.mocked(articlesActions.saveArticleAction).mockResolvedValue({
      success: true,
      id: 'pub-migrated-1',
      slug: 'borrador-previo-1',
    });

    vi.spyOn(storage, 'uploadStorageImage').mockResolvedValue({
      publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-migrated-1/cover.webp',
      path: 'publications/pub-migrated-1/cover.webp',
      width: 1200,
      height: 800,
    });

    const { container } = render(
      <ArticleEditor
        mode="create"
        onSave={onSave}
        isPublishing={false}
      />
    );

    // Wait for fetchProfile() to resolve currentUserId ('usr-test') so draftKey becomes cerna_draft_usr-test_new
    await new Promise((resolve) => setTimeout(resolve, 20));

    const cachedPayload = serializeDraft({
      title: { gl: 'Borrador Previo', es: '' },
      subtitle: { gl: '', es: '' },
      content: { gl: '<p>Contido en caché</p>', es: '' },
      cover_image_url: '',
      tags: [],
      type: 'article',
      original_language: 'gl',
      show_index: false,
    });
    window.localStorage.setItem('cerna_draft_usr-test_new', cachedPayload);

    const [coverFileInput] = container.querySelectorAll('input[type="file"]');
    fireEvent.change(coverFileInput, {
      target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
    });

    await waitFor(() => {
      expect(window.localStorage.getItem('cerna_draft_pub-migrated-1')).toBe(cachedPayload);
    });
    expect(window.localStorage.getItem('cerna_draft_usr-test_new')).toBeNull();

    // Verify old key is preserved if setItem throws during migration
    const { container: container2 } = render(
      <ArticleEditor
        mode="create"
        onSave={onSave}
        isPublishing={false}
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    window.localStorage.setItem('cerna_draft_usr-test_new', cachedPayload);
    const origSetItem = window.localStorage.setItem;
    vi.spyOn(window.localStorage, 'setItem').mockImplementation((key: string, val: string) => {
      if (key === 'cerna_draft_pub-migrated-2') {
        throw new Error('QuotaExceededError');
      }
      return origSetItem(key, val);
    });

    vi.mocked(articlesActions.saveArticleAction).mockResolvedValueOnce({
      success: true,
      id: 'pub-migrated-2',
      slug: 'borrador-previo-2',
    });

    const [coverFileInput2] = container2.querySelectorAll('input[type="file"]');
    fireEvent.change(coverFileInput2, {
      target: { files: [new File(['cover2'], 'cover2.png', { type: 'image/png' })] },
    });

    await waitFor(() => {
      expect(articlesActions.saveArticleAction).toHaveBeenCalledTimes(2);
    });
    expect(window.localStorage.getItem('cerna_draft_usr-test_new')).toBe(cachedPayload);
    expect(window.localStorage.getItem('cerna_draft_pub-migrated-2')).toBeNull();

    replaceStateSpy.mockRestore();
  });

  it('clears both _new draftKey and cerna_draft_<id> after a base64-triggered lazy save succeeds', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    vi.mocked(articlesActions.saveArticleAction).mockResolvedValue({
      success: true,
      id: 'pub-b64-1',
      slug: 'con-base64-1',
    });

    vi.spyOn(storage, 'uploadStorageImage').mockResolvedValue({
      publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-b64-1/inline/pasted.webp',
      path: 'publications/pub-b64-1/inline/pasted.webp',
      width: 400,
      height: 300,
    });

    render(
      <ArticleEditor
        mode="create"
        initialData={{
          title: { gl: 'Con Base64', es: '' },
          content: { gl: '<p><img src="data:image/png;base64,AAAA" /></p>', es: '' },
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    window.localStorage.setItem('cerna_draft_usr-test_new', JSON.stringify({ title: { gl: 'Con Base64' } }));
    window.localStorage.setItem('cerna_draft_pub-b64-1', JSON.stringify({ title: { gl: 'Stale entity cache' } }));

    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'pub-b64-1' }),
        'draft'
      );
    });

    expect(window.localStorage.getItem('cerna_draft_usr-test_new')).toBeNull();
    expect(window.localStorage.getItem('cerna_draft_pub-b64-1')).toBeNull();

    replaceStateSpy.mockRestore();
  });

  it('plain-text save awaits an in-flight lazy draft creation and passes the resolved publicationId to onSave', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    let resolveLazyDraft!: (val: { success: boolean; id: string; slug: string }) => void;
    const lazyDraftDeferred = new Promise<{ success: boolean; id: string; slug: string }>((resolve) => {
      resolveLazyDraft = resolve;
    });

    vi.mocked(articlesActions.saveArticleAction).mockReturnValueOnce(lazyDraftDeferred);

    vi.spyOn(storage, 'uploadStorageImage').mockResolvedValue({
      publicUrl: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/pub-inflight-7/inline/pasted.webp',
      path: 'publications/pub-inflight-7/inline/pasted.webp',
      width: 400,
      height: 300,
    });

    render(
      <ArticleEditor
        mode="create"
        initialData={{
          title: { gl: 'Concorrente', es: '' },
          content: { gl: '<p><img src="data:image/png;base64,BBBB" /></p>', es: '' },
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    window.localStorage.setItem('cerna_draft_usr-test_new', JSON.stringify({ title: { gl: 'Concorrente' } }));

    // Trigger first save (with base64) so lazyDraftPromiseRef.current is in flight
    const draftButton = screen.getByRole('button', { name: /borrador/i });
    fireEvent.click(draftButton);

    await waitFor(() => {
      expect(articlesActions.saveArticleAction).toHaveBeenCalledTimes(1);
    });

    // Clear content to plain text and trigger a second plain-text save while lazy draft is still pending
    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Concorrente')).not.toBeInTheDocument();
    });

    fireEvent.click(draftButton);
    // Neither save can complete until the in-flight lazy draft resolves
    expect(onSave).not.toHaveBeenCalled();

    resolveLazyDraft({
      success: true,
      id: 'pub-inflight-7',
      slug: 'concorrente-7',
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(2);
    });

    expect(articlesActions.saveArticleAction).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'pub-inflight-7' }),
      'draft'
    );
    expect(onSave).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'pub-inflight-7' }),
      'draft'
    );
    expect(window.localStorage.getItem('cerna_draft_usr-test_new')).toBeNull();
    expect(window.localStorage.getItem('cerna_draft_pub-inflight-7')).toBeNull();

    replaceStateSpy.mockRestore();
  });

  it('defaults to Bilingual mode for new publications with AI Translate and Original Language visible', () => {
    render(
      <ArticleEditor
        mode="create"
        onSave={vi.fn().mockResolvedValue(true)}
        isPublishing={false}
      />
    );

    const modeSwitch = screen.getByRole('switch', { name: /modo de idioma/i });
    expect(modeSwitch).toHaveAttribute('aria-checked', 'false');
    expect(modeSwitch).toHaveTextContent(/bilingüe/i);
    expect(screen.getByRole('button', { name: /traducir a/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /idioma orixinal/i })).toBeInTheDocument();
  });

  it('initializes an existing Spanish-only Monolingual Publication directly in Monolingual mode on Spanish', async () => {
    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-mono-es',
          title: { es: 'Ensayo solo en español' },
          content: { es: '<p>Cuerpo exclusivamente en español.</p>' },
          original_language: 'es',
        }}
        onSave={vi.fn().mockResolvedValue(true)}
        isPublishing={false}
      />
    );

    const modeSwitch = screen.getByRole('switch', { name: /modo de idioma/i });
    expect(modeSwitch).toHaveAttribute('aria-checked', 'true');
    expect(modeSwitch).toHaveTextContent(/monolingüe/i);

    // Spanish title and body loaded directly (not empty Galician tab)
    expect(screen.getByDisplayValue('Ensayo solo en español')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Cuerpo exclusivamente en español.')).toBeInTheDocument();
    });

    // Only the active Spanish tab is shown in Monolingual mode (Galician tab hidden)
    expect(screen.getByRole('button', { name: /^castellano$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^galego$/i })).not.toBeInTheDocument();

    // AI Translate button is hidden; single-language selector is shown with 'es' selected
    expect(screen.queryByRole('button', { name: /traducir a/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /idioma orixinal/i })).not.toBeInTheDocument();
    const singleLangSelect = screen.getByRole('combobox', { name: /idioma da publicación/i });
    expect(singleLangSelect).toHaveValue('es');
  });

  it('shows only the selected language tab and updates both active language and original_language via the monolingual selector', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    render(
      <ArticleEditor
        mode="create"
        onSave={onSave}
        isPublishing={false}
      />
    );

    // Toggle to Monolingual mode -> only Galego tab visible
    fireEvent.click(screen.getByRole('switch', { name: /modo de idioma/i }));
    expect(screen.getByRole('button', { name: /^galego$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^castellano$/i })).not.toBeInTheDocument();

    // Switch single language to Spanish via the monolingual selector
    const singleLangSelect = screen.getByRole('combobox', { name: /idioma da publicación/i });
    fireEvent.change(singleLangSelect, { target: { value: 'es' } });

    // Now only Castellano tab is visible
    expect(screen.getByRole('button', { name: /^castellano$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^galego$/i })).not.toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/el título de tu investigación/i);
    fireEvent.change(titleInput, { target: { value: 'Título Monolingüe ES' } });

    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          language_mode: 'monolingual',
          original_language: 'es',
          title: { es: 'Título Monolingüe ES' },
        }),
        'draft'
      );
    });
  });

  it('preserves inactive language unsaved edits in memory and draft serialization across Bilingual -> Monolingual -> Bilingual toggles', () => {
    render(
      <ArticleEditor
        mode="create"
        onSave={vi.fn().mockResolvedValue(true)}
        isPublishing={false}
      />
    );

    // Edit Galician title
    fireEvent.change(screen.getByPlaceholderText(/o título da túa investigación/i), {
      target: { value: 'Título GL sen gardar' },
    });

    // Switch to Spanish and edit Spanish title
    fireEvent.click(screen.getByRole('button', { name: /^castellano$/i }));
    fireEvent.change(screen.getByPlaceholderText(/el título de tu investigación/i), {
      target: { value: 'Título ES sen gardar' },
    });

    // Switch back to Galician, toggle to Monolingual, then back to Bilingual
    fireEvent.click(screen.getByRole('button', { name: /^galego$/i }));
    const modeSwitch = screen.getByRole('switch', { name: /modo de idioma/i });
    fireEvent.click(modeSwitch); // -> Monolingual
    expect(modeSwitch).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(modeSwitch); // -> Bilingual
    expect(modeSwitch).toHaveAttribute('aria-checked', 'false');

    // Switch to Spanish tab and verify unsaved Spanish title is still intact
    fireEvent.click(screen.getByRole('button', { name: /^castellano$/i }));
    expect(screen.getByDisplayValue('Título ES sen gardar')).toBeInTheDocument();

    // Draft serialization preserves language_mode
    const serialized = serializeDraft({
      title: { gl: 'GL', es: 'ES' },
      subtitle: { gl: '', es: '' },
      content: { gl: '<p>GL</p>', es: '<p>ES</p>' },
      cover_image_url: '',
      tags: [],
      type: 'article',
      original_language: 'gl',
      language_mode: 'monolingual',
      show_index: false,
    });
    const parsed = parseDraft(serialized);
    expect(parsed?.languageMode).toBe('monolingual');
    expect(parsed?.titles).toEqual({ gl: 'GL', es: 'ES' });
  });

  it('allows upgrading an existing Monolingual Publication to Bilingual and saving both languages', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-upgrade-1',
          title: { gl: 'Título Galego Orixinal' },
          content: { gl: '<p>Contido en galego.</p>' },
          original_language: 'gl',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    const modeSwitch = screen.getByRole('switch', { name: /modo de idioma/i });
    expect(modeSwitch).toHaveAttribute('aria-checked', 'true');

    // Flip to Bilingual
    fireEvent.click(modeSwitch);
    expect(modeSwitch).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: /traducir a/i })).toBeInTheDocument();

    // Author Spanish title
    fireEvent.click(screen.getByRole('button', { name: /^castellano$/i }));
    fireEvent.change(screen.getByPlaceholderText(/el título de tu investigación/i), {
      target: { value: 'Título Español Añadido' },
    });

    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          language_mode: 'bilingual',
          title: { gl: 'Título Galego Orixinal', es: 'Título Español Añadido' },
        }),
        'draft'
      );
    });
  });

  it('restores and saves a Spanish monolingual local draft over the initial Galician locale', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    window.localStorage.setItem('cerna_draft_restore-es', JSON.stringify({
      title: { es: 'Título del borrador' },
      content: { es: '<p>Cuerpo del borrador</p>' },
      original_language: 'es',
      language_mode: 'monolingual',
    }));

    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'restore-es',
          title: { gl: 'Título orixinal', es: 'Título guardado' },
          content: { gl: '<p>Corpo orixinal</p>', es: '<p>Cuerpo guardado</p>' },
          original_language: 'gl',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    await screen.findByText('Cuerpo del borrador');
    expect(screen.getByRole('combobox', { name: 'Idioma da publicación' })).toHaveValue('es');
    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          original_language: 'es',
          title: { es: 'Título del borrador' },
          content: { es: '<p>Cuerpo del borrador</p>' },
        }),
        'draft'
      );
    });
  });

  it('saves the original tab body if the locale changes during the auth lookup', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'auth-wait',
          title: { gl: 'Título GL', es: 'Título ES' },
          content: { gl: '<p>Corpo galego</p>', es: '<p>Cuerpo español</p>' },
          original_language: 'gl',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    await screen.findByText('Corpo galego');
    let resolveAuth!: (result: { data: { user: { id: string } } }) => void;
    mockGetUser.mockReturnValueOnce(new Promise((resolve) => { resolveAuth = resolve; }));
    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));
    fireEvent.click(screen.getByRole('button', { name: /^castellano$/i }));
    await screen.findByText('Cuerpo español');
    resolveAuth({ data: { user: { id: 'usr-test' } } });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          content: { gl: '<p>Corpo galego</p>', es: '<p>Cuerpo español</p>' },
        }),
        'draft'
      );
    });
  });

  it('prompts for confirmation before downgrading a saved bilingual publication to monolingual and cleans up dropped-language inline images once confirmed', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    render(
      <ArticleEditor
        mode="edit"
        initialData={{
          id: 'art-downgrade-1',
          cover_image_url: 'https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/u1/cover.webp',
          title: { gl: 'Título Galego', es: 'Título Español' },
          content: {
            gl: '<p>Contido GL <img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/inline/u1/shared.webp" /></p>',
            es: '<p>Contenido ES <img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/inline/u1/shared.webp" /><img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/inline/u1/es-only.webp" /><img src="https://srbrnpbtfmilohkicpbb.supabase.co/storage/v1/object/public/media/publications/covers/u1/cover.webp" /></p>',
          },
          original_language: 'gl',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    // Toggle to Monolingual (keeping Galician, dropping Spanish)
    fireEvent.click(screen.getByRole('switch', { name: /modo de idioma/i }));

    // First attempt: user cancels downgrade confirmation
    mockConfirm.mockResolvedValueOnce(false);
    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledTimes(1);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Second attempt: user confirms downgrade
    mockConfirm.mockResolvedValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          language_mode: 'monolingual',
          original_language: 'gl',
          title: { gl: 'Título Galego' },
        }),
        'draft'
      );
    });

    const savedPayload = onSave.mock.calls[0][0];
    expect(savedPayload.title).not.toHaveProperty('es');
    expect(savedPayload.content).not.toHaveProperty('es');

    await waitFor(() => {
      expect(removeStorageImagesSpy).toHaveBeenCalledWith(
        expect.anything(),
        ['publications/inline/u1/es-only.webp']
      );
    });
  });

  it('validates required title and meaningful body for the chosen mode before publishing or submitting for review', async () => {
    const onSave = vi.fn().mockResolvedValue(true);

    // Member submitting incomplete Bilingual publication (missing Spanish)
    const { unmount } = render(
      <ArticleEditor
        mode="edit"
        userRole="member"
        initialData={{
          id: 'art-val-bi',
          title: { gl: 'Título Galego', es: '' },
          content: { gl: '<p>Contido en galego.</p>', es: '<p></p>' },
          original_language: 'gl',
          language_mode: 'bilingual',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /enviar para aprobación/i }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/bilingüe/i));
    });
    expect(onSave).not.toHaveBeenCalled();
    unmount();

    // Founder publishing incomplete Monolingual publication (empty body)
    mockToastError.mockClear();
    render(
      <ArticleEditor
        mode="edit"
        userRole="founder"
        initialData={{
          id: 'art-val-mono',
          title: { es: 'Solo título' },
          content: { es: '<p></p>' },
          original_language: 'es',
          language_mode: 'monolingual',
        }}
        onSave={onSave}
        isPublishing={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /^publicar$/i }));
    expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/castellano/i));
    expect(screen.queryByText(/¿publicar cambios\?/i)).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('displays exact target language summary in PublishConfirmModal for Galician-only, Spanish-only, and Bilingual modes', () => {
    // 1. Bilingual
    const { unmount: unmountBi } = render(
      <ArticleEditor
        mode="edit"
        userRole="founder"
        initialData={{
          id: 'art-pub-bi',
          title: { gl: 'Título GL', es: 'Título ES' },
          content: { gl: '<p>Contido GL</p>', es: '<p>Contenido ES</p>' },
          original_language: 'gl',
        }}
        onSave={vi.fn().mockResolvedValue(true)}
        isPublishing={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^publicar$/i }));
    expect(screen.getByText(/galego e castelán/i)).toBeInTheDocument();
    unmountBi();

    // 2. Monolingual Galician
    const { unmount: unmountGl } = render(
      <ArticleEditor
        mode="edit"
        userRole="founder"
        initialData={{
          id: 'art-pub-gl',
          title: { gl: 'Título GL' },
          content: { gl: '<p>Contido GL</p>' },
          original_language: 'gl',
        }}
        onSave={vi.fn().mockResolvedValue(true)}
        isPublishing={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^publicar$/i }));
    expect(screen.getByText(/idiomas a publicar/i).parentElement).toHaveTextContent(/só en galego/i);
    unmountGl();

    // 3. Monolingual Spanish
    render(
      <ArticleEditor
        mode="edit"
        userRole="founder"
        initialData={{
          id: 'art-pub-es',
          title: { es: 'Título ES' },
          content: { es: '<p>Contenido ES</p>' },
          original_language: 'es',
        }}
        onSave={vi.fn().mockResolvedValue(true)}
        isPublishing={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^publicar$/i }));
    expect(screen.getByText(/idiomas a publicar/i).parentElement).toHaveTextContent(/só en castellano/i);
  });
});
