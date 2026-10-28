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
  let removeStorageImagesSpy: ReturnType<typeof vi.spyOn>;
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
});
