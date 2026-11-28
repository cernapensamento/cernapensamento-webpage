import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PinArticleButton from './PinArticleButton';
import { PERMISSIONS } from '@/lib/db/schema';
import * as feedbackProvider from '@/components/ui/FeedbackProvider';
import type { ToastApi } from '@/components/ui/FeedbackProvider';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => 'gl',
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({}),
}));

vi.mock('@/components/ui/FeedbackProvider', () => ({
  useToast: vi.fn(),
}));

describe('PinArticleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(feedbackProvider.useToast).mockReturnValue({
      error: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    } as unknown as ToastApi);
  });

  it('renders nothing when permissions are omitted or lack publications:pin', () => {
    const { container, rerender } = render(<PinArticleButton id="pub-1" />);
    expect(container).toBeEmptyDOMElement();

    rerender(<PinArticleButton id="pub-1" permissions={[]} />);
    expect(container).toBeEmptyDOMElement();

    rerender(
      <PinArticleButton
        id="pub-1"
        permissions={[PERMISSIONS.PUBLICATIONS_PUBLISH, PERMISSIONS.PUBLICATIONS_REVIEW]}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders pin button when publications:pin permission is granted', () => {
    render(<PinArticleButton id="pub-1" permissions={[PERMISSIONS.PUBLICATIONS_PIN]} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
