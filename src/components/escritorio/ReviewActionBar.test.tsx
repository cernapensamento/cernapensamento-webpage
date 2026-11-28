import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewActionBar from './ReviewActionBar';
import {
  PERMISSIONS,
  PUBLICATION_STATUSES,
  USER_ROLES,
  resolvePermissionsForRoles,
} from '@/lib/db/schema';
import * as authHook from '@/hooks/useAuth';
import * as articleActions from '@/actions/articles';
import * as feedbackProvider from '@/components/ui/FeedbackProvider';
import type { User } from '@supabase/supabase-js';
import type { ToastApi } from '@/components/ui/FeedbackProvider';
import type { AuthProfile } from '@/lib/db/types';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/actions/articles', () => ({
  updateArticleState: vi.fn(),
}));

vi.mock('@/components/ui/FeedbackProvider', () => ({
  useToast: vi.fn(),
}));

function buildProfile(
  roles: AuthProfile['roles'],
  permissions: AuthProfile['permissions'] = resolvePermissionsForRoles(roles)
): AuthProfile {
  return {
    roles,
    permissions,
    avatar_url: null,
    full_name: null,
  };
}

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

  it.each([
    { label: 'reader', profile: buildProfile([USER_ROLES.READER]) },
    { label: 'guest', profile: buildProfile([USER_ROLES.GUEST]) },
    { label: 'member', profile: buildProfile([USER_ROLES.MEMBER]) },
    { label: 'overlapping guest + member', profile: buildProfile([USER_ROLES.GUEST, USER_ROLES.MEMBER]) },
    { label: 'zero-role', profile: buildProfile([], []) },
    {
      label: 'custom publications:publish only without publications:review',
      profile: buildProfile([], [PERMISSIONS.PUBLICATIONS_PUBLISH]),
    },
  ])('renders nothing for $label user lacking publications:review', ({ profile }) => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'user-1' } as unknown as User,
      profile,
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
      profile: buildProfile([USER_ROLES.ADMIN]),
      loading: false,
    });

    const { container } = render(
      <ReviewActionBar articuloId="art-1" status={PUBLICATION_STATUSES.PUBLISHED} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    { label: 'admin', profile: buildProfile([USER_ROLES.ADMIN]) },
    { label: 'founder', profile: buildProfile([USER_ROLES.FOUNDER]) },
    { label: 'overlapping founder + admin', profile: buildProfile([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]) },
    {
      label: 'custom publications:review only',
      profile: buildProfile([], [PERMISSIONS.PUBLICATIONS_REVIEW]),
    },
  ])('renders review controls for $label user when publication is in_review', ({ profile }) => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'reviewer-1' } as unknown as User,
      profile,
      loading: false,
    });

    render(<ReviewActionBar articuloId="art-1" status={PUBLICATION_STATUSES.IN_REVIEW} />);

    expect(screen.getByText(/Modo Revisión/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rexeitar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aprobar/i })).toBeInTheDocument();
  });

  it('approves article when clicking approve button', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'admin-1' } as unknown as User,
      profile: buildProfile([USER_ROLES.ADMIN]),
      loading: false,
    });
    vi.mocked(articleActions.updateArticleState).mockResolvedValueOnce({ success: true });

    render(<ReviewActionBar articuloId="art-123" status={PUBLICATION_STATUSES.IN_REVIEW} />);

    fireEvent.click(screen.getByRole('button', { name: /Aprobar/i }));

    await waitFor(() => {
      expect(articleActions.updateArticleState).toHaveBeenCalledWith(
        'art-123',
        PUBLICATION_STATUSES.PUBLISHED,
        'gl'
      );
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it('rejects article when clicking reject button', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 'admin-1' } as unknown as User,
      profile: buildProfile([USER_ROLES.ADMIN]),
      loading: false,
    });
    vi.mocked(articleActions.updateArticleState).mockResolvedValueOnce({ success: true });

    render(<ReviewActionBar articuloId="art-123" status={PUBLICATION_STATUSES.IN_REVIEW} />);

    fireEvent.click(screen.getByRole('button', { name: /Rexeitar/i }));

    await waitFor(() => {
      expect(articleActions.updateArticleState).toHaveBeenCalledWith(
        'art-123',
        PUBLICATION_STATUSES.DRAFT,
        'gl'
      );
      expect(mockToast.success).toHaveBeenCalled();
    });
  });
});
