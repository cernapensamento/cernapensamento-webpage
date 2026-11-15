import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditarArticuloForm from './EditarArticuloForm';
import * as articlesActions from '@/actions/articles';
import type { ArticleData, EditorAction } from '@/components/escritorio/ArticleEditor';
import { EDITOR_ACTIONS } from '@/lib/db/schema';
import type { PublicationDetail } from '@/lib/db/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/components/ui/FeedbackProvider', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

vi.mock('@/actions/articles', () => ({
  saveArticleAction: vi.fn(),
}));

// Mock ArticleEditor to easily inspect props and trigger onSave
vi.mock('@/components/escritorio/ArticleEditor', () => ({
  default: ({
    mode = 'edit',
    initialData,
    onSave,
    isPublishing,
  }: {
    mode?: 'create' | 'edit';
    initialData?: ArticleData;
    onSave: (data: ArticleData, action: EditorAction) => Promise<boolean>;
    isPublishing: boolean;
  }) => {
    const payload = initialData ?? {
      title: { gl: 'Novo Artigo GL', es: 'Nuevo Artículo ES' },
      content: { gl: '<p>Novo</p>', es: '<p>Nuevo</p>' },
    };
    return (
      <div data-testid="article-editor">
        <span data-testid="editor-mode">{mode}</span>
        <span data-testid="editor-title-gl">{initialData?.title?.gl}</span>
        <span data-testid="is-publishing">{String(isPublishing)}</span>
        <button
          data-testid="save-draft-btn"
          onClick={() => onSave(payload, EDITOR_ACTIONS.DRAFT)}
        >
          Save Draft
        </button>
        <button
          data-testid="publish-btn"
          onClick={() => onSave(payload, EDITOR_ACTIONS.PUBLISH)}
        >
          Publish
        </button>
      </div>
    );
  },
}));

describe('EditarArticuloForm', () => {
  const mockPublication = {
    id: 'pub-test-123',
    slug: 'meu-artigo-123456',
    title: { gl: 'Meu Artigo Galego', es: 'Mi Artículo Español' },
    subtitle: { gl: 'Subtítulo GL', es: 'Subtítulo ES' },
    content: { gl: '<p>Contido</p>', es: '<p>Contenido</p>' },
    cover_image_url: 'https://example.com/cover.webp',
    tags: [{ id: 't-1', slug: 'filosofia', name: 'Filosofía' }],
    status: 'draft',
    type: 'article',
    original_language: 'gl',
    published_at: null,
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    author_id: 'auth-1',
    author: {
      id: 'auth-1',
      full_name: 'Autor Proba',
      slug: 'autor-proba',
      avatar_url: null,
      bio: null,
    },
  } as unknown as PublicationDetail;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and populates initial data', () => {
    render(
      <EditarArticuloForm
        publication={mockPublication}
        userRole="founder"
        lang="gl"
      />
    );

    expect(screen.getByTestId('article-editor')).toBeInTheDocument();
    expect(screen.getByTestId('editor-title-gl').textContent).toBe('Meu Artigo Galego');
  });

  it('throws an error if no publication is passed', () => {
    expect(() => {
      render(
        <EditarArticuloForm
          userRole="founder"
          lang="gl"
        />
      );
    }).toThrow('EditarArticuloForm requires a publication prop');
  });

  it('delegates save to saveArticleAction and redirects on success', async () => {
    vi.mocked(articlesActions.saveArticleAction).mockResolvedValue({
      success: true,
      id: 'pub-test-123',
      slug: 'meu-artigo-123456',
    });

    render(
      <EditarArticuloForm
        publication={mockPublication}
        userRole="founder"
        lang="gl"
      />
    );

    fireEvent.click(screen.getByTestId('save-draft-btn'));

    await waitFor(() => {
      expect(articlesActions.saveArticleAction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'pub-test-123',
          action: EDITOR_ACTIONS.DRAFT,
          lang: 'gl',
          title: { gl: 'Meu Artigo Galego', es: 'Mi Artículo Español' },
        })
      );
      expect(mockToastSuccess).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/gl/escritorio');
    });
  });

  it('shows error toast and does not redirect if saveArticleAction fails', async () => {
    vi.mocked(articlesActions.saveArticleAction).mockResolvedValue({
      success: false,
      error: 'Erro de permisos ao gardar',
    });

    render(
      <EditarArticuloForm
        publication={mockPublication}
        userRole="reader"
        lang="gl"
      />
    );

    fireEvent.click(screen.getByTestId('publish-btn'));

    await waitFor(() => {
      expect(articlesActions.saveArticleAction).toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith('Erro de permisos ao gardar');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('supports create mode without publication prop and submits without id', async () => {
    vi.mocked(articlesActions.saveArticleAction).mockResolvedValue({
      success: true,
      id: 'new-pub-1',
      slug: 'novo-artigo-gl-123456',
    });

    render(
      <EditarArticuloForm
        mode="create"
        userRole="founder"
        lang="gl"
      />
    );

    expect(screen.getByTestId('editor-mode').textContent).toBe('create');
    fireEvent.click(screen.getByTestId('save-draft-btn'));

    await waitFor(() => {
      expect(articlesActions.saveArticleAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: EDITOR_ACTIONS.DRAFT,
          lang: 'gl',
          title: { gl: 'Novo Artigo GL', es: 'Nuevo Artículo ES' },
        })
      );
      const callArg = vi.mocked(articlesActions.saveArticleAction).mock.calls[0][0];
      expect(callArg.id).toBeUndefined();
      expect(mockToastSuccess).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/gl/escritorio');
    });
  });
});
