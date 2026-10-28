import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewActionBar from './ReviewActionBar';
import { PUBLICATION_STATUSES } from '@/lib/db/schema';
import * as authHook from '@/hooks/useAuth';
import * as articleActions from '@/actions/articles';
import * as feedbackProvider from '@/components/ui/FeedbackProvider';
import type { User } from '@supabase/supabase-js';
import type { ToastApi } from '@/components/ui/FeedbackProvider';
import type { Profile } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/actions/articles', () => ({
  updateArticleState: vi.fn(),
}));

vi.mock('@/components/ui/FeedbackProvider', () => ({
  useToast: vi.fn(),
}));

describe('ReviewActionBar Component', () => {
  const mockToast = {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(feedbackProvider.useToast).mockReturnValue(mockToast as unknown as ToastApi);
  });

  it('renders nothing when auth is still loading', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: true,
    });

    const { container } = render(
      <ReviewActionBar articuloId="art-1" status={PUBLICATION_STATUSES.IN_REVIEW} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when user is not authenticated', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
    });

    const { container } = render(
      <ReviewActionBar articuloId="art-1" status={PUBLICATION_STATUSES.IN_REVIEW} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when user role is reader or member', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'reader-1' } as unknown as User,
      profile: { role: 'reader', rol: 'reader', avatar_url: null, full_name: null, nombre: null },
      loading: false,
    });

    const { container } = render(
      <ReviewActionBar articuloId="art-1" status={PUBLICATION_STATUSES.IN_REVIEW} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when publication status is not in_review', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'admin-1' } as unknown as User,
      profile: { role: 'admin', rol: 'admin', avatar_url: null, full_name: null, nombre: null },
      loading: false,
    });

    const { container } = render(
      <ReviewActionBar articuloId="art-1" status={PUBLICATION_STATUSES.PUBLISHED} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders when user is admin and publication is in_review', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'admin-1' } as unknown as User,
      profile: { role: 'admin', rol: 'admin', avatar_url: null, full_name: null, nombre: null },
      loading: false,
    });

    render(<ReviewActionBar articuloId="art-1" status={PUBLICATION_STATUSES.IN_REVIEW} />);

    expect(screen.getByText(/Modo Revisión/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rexeitar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aprobar/i })).toBeInTheDocument();
  });

  it('renders when user is founder and publication is in_review', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'founder-1' } as unknown as User,
      profile: { role: 'founder', rol: 'founder', avatar_url: null, full_name: null, nombre: null },
      loading: false,
    });

    render(<ReviewActionBar articuloId="art-1" status={PUBLICATION_STATUSES.IN_REVIEW} />);

    expect(screen.getByText(/Modo Revisión/i)).toBeInTheDocument();
  });

  it('renders when user is escritor and publication is in_review', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'escritor-1' } as unknown as User,
      profile: { role: 'escritor', rol: 'escritor', avatar_url: null, full_name: null, nombre: null } as unknown as Profile,
      loading: false,
    });

    render(<ReviewActionBar articuloId="art-1" status={PUBLICATION_STATUSES.IN_REVIEW} />);

    expect(screen.getByText(/Modo Revisión/i)).toBeInTheDocument();
  });

  it('approves article when clicking approve button', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'admin-1' } as unknown as User,
      profile: { role: 'admin', rol: 'admin', avatar_url: null, full_name: null, nombre: null },
      loading: false,
    });
    vi.mocked(articleActions.updateArticleState).mockResolvedValueOnce({ success: true });

    render(<ReviewActionBar articuloId="art-123" status={PUBLICATION_STATUSES.IN_REVIEW} />);

    const approveBtn = screen.getByRole('button', { name: /Aprobar/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(articleActions.updateArticleState).toHaveBeenCalledWith('art-123', PUBLICATION_STATUSES.PUBLISHED);
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it('rejects article when clicking reject button', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'admin-1' } as unknown as User,
      profile: { role: 'admin', rol: 'admin', avatar_url: null, full_name: null, nombre: null },
      loading: false,
    });
    vi.mocked(articleActions.updateArticleState).mockResolvedValueOnce({ success: true });

    render(<ReviewActionBar articuloId="art-123" status={PUBLICATION_STATUSES.IN_REVIEW} />);

    const rejectBtn = screen.getByRole('button', { name: /Rexeitar/i });
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(articleActions.updateArticleState).toHaveBeenCalledWith('art-123', PUBLICATION_STATUSES.DRAFT);
      expect(mockToast.success).toHaveBeenCalled();
    });
  });
});
