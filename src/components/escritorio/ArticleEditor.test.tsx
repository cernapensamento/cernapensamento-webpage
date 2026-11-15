import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArticleEditor from './ArticleEditor';
import * as storage from '@/lib/storage';

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'usr-test' } },
      }),
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

vi.mock('@/components/ui/FeedbackProvider', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
  useConfirm: () => vi.fn().mockResolvedValue(true),
  usePrompt: () => vi.fn().mockResolvedValue('test'),
}));

describe('ArticleEditor Save Flow and Storage Garbage Collection', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let removeStorageImagesSpy: any;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
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

    const tocSwitch = screen.getByRole('switch', { name: /índice automático/i });
    expect(tocSwitch).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByRole('navigation', { name: /índice do artigo/i })).not.toBeInTheDocument();

    // Turn index on and confirm live writing preview appears above the editor body
    fireEvent.click(tocSwitch);
    expect(tocSwitch).toHaveAttribute('aria-checked', 'true');
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

    const tocSwitch = screen.getByRole('switch', { name: /índice automático/i });
    expect(tocSwitch).toHaveAttribute('aria-checked', 'true');
    const liveNav = await screen.findByRole('navigation', { name: /índice do artigo/i });
    expect(liveNav).toHaveTextContent('Sección Legada');

    fireEvent.click(screen.getByRole('button', { name: /borrador/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const savedPayload = onSave.mock.calls[0][0];
    expect(savedPayload.show_index).toBe(true);
    expect(savedPayload.content?.gl).not.toContain('data-type="article-index"');
  });
});
