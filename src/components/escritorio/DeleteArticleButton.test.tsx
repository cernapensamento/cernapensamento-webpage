import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteArticleButton from './DeleteArticleButton';
import * as articleActions from '@/actions/articles';
import * as feedbackProvider from '@/components/ui/FeedbackProvider';
import type { ToastApi } from '@/components/ui/FeedbackProvider';

const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => 'gl',
}));

vi.mock('@/actions/articles', () => ({
  deleteArticleAction: vi.fn(),
}));

vi.mock('@/components/ui/FeedbackProvider', () => ({
  useConfirm: vi.fn(),
  useToast: vi.fn(),
}));

describe('DeleteArticleButton', () => {
  const mockConfirm = vi.fn();
  const mockToast = {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(feedbackProvider.useConfirm).mockReturnValue(mockConfirm);
    vi.mocked(feedbackProvider.useToast).mockReturnValue(mockToast as unknown as ToastApi);
  });

  it('does not call deleteArticleAction when user cancels confirmation', async () => {
    mockConfirm.mockResolvedValue(false);

    render(<DeleteArticleButton id="pub-1" titulo="Artigo de proba" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledTimes(1);
    });
    expect(articleActions.deleteArticleAction).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('delegates deletion to deleteArticleAction and refreshes router on success', async () => {
    mockConfirm.mockResolvedValue(true);
    vi.mocked(articleActions.deleteArticleAction).mockResolvedValue({ success: true });

    render(<DeleteArticleButton id="pub-1" titulo="Artigo de proba" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(articleActions.deleteArticleAction).toHaveBeenCalledWith('pub-1', 'gl');
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('shows an error toast and does not refresh when deleteArticleAction fails', async () => {
    mockConfirm.mockResolvedValue(true);
    vi.mocked(articleActions.deleteArticleAction).mockResolvedValue({
      success: false,
      error: 'Non autorizado',
    });

    render(<DeleteArticleButton id="pub-1" titulo="Artigo de proba" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Non autorizado'));
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
