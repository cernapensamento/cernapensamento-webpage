import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import ProfileDashboard from './ProfileDashboard';
import { getDictionaryClient } from '@/dictionaries/client';
import { USER_ROLES, resolvePermissionsForRoles, type UserRoleValue } from '@/lib/db/schema';

let mockLocale = 'gl';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => mockLocale,
}));

vi.mock('@/components/ui/FeedbackProvider', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

vi.mock('@/components/forms/PasswordForm', () => ({
  default: () => <div data-testid="password-form" />,
}));

vi.mock('@/actions/auth', () => ({
  handleSignOut: vi.fn(),
}));

const mockUser = {
  id: 'user-1',
  email: 'autor@cerna.org',
  created_at: '2025-01-01T00:00:00Z',
  app_metadata: { providers: [] },
} as unknown as User;

function buildProfile(roles: UserRoleValue[]) {
  return {
    id: 'user-1',
    full_name: 'Uxío Novoneyra',
    slug: 'uxio-novoneyra',
    bio: { gl: 'Biografía', es: 'Biografía' },
    avatar_url: null,
    newsletter_subscribed: false,
    roles,
    permissions: resolvePermissionsForRoles(roles),
  };
}

describe('ProfileDashboard multi-role identity rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocale = 'gl';
  });

  it.each([
    {
      label: 'reader',
      roles: [USER_ROLES.READER],
      expectedGl: getDictionaryClient('gl').dashboard.reader,
      expectedEs: getDictionaryClient('es').dashboard.reader,
    },
    {
      label: 'guest',
      roles: [USER_ROLES.GUEST],
      expectedGl: getDictionaryClient('gl').dashboard.guest,
      expectedEs: getDictionaryClient('es').dashboard.guest,
    },
    {
      label: 'member',
      roles: [USER_ROLES.MEMBER],
      expectedGl: getDictionaryClient('gl').dashboard.member,
      expectedEs: getDictionaryClient('es').dashboard.member,
    },
    {
      label: 'founder',
      roles: [USER_ROLES.FOUNDER],
      expectedGl: getDictionaryClient('gl').dashboard.founder,
      expectedEs: getDictionaryClient('es').dashboard.founder,
    },
    {
      label: 'admin',
      roles: [USER_ROLES.ADMIN],
      expectedGl: getDictionaryClient('gl').dashboard.admin,
      expectedEs: getDictionaryClient('es').dashboard.admin,
    },
    {
      label: 'overlapping guest + member',
      roles: [USER_ROLES.GUEST, USER_ROLES.MEMBER],
      expectedGl: `${getDictionaryClient('gl').dashboard.guest} · ${getDictionaryClient('gl').dashboard.member}`,
      expectedEs: `${getDictionaryClient('es').dashboard.guest} · ${getDictionaryClient('es').dashboard.member}`,
    },
    {
      label: 'overlapping founder + admin',
      roles: [USER_ROLES.FOUNDER, USER_ROLES.ADMIN],
      expectedGl: `${getDictionaryClient('gl').dashboard.founder} · ${getDictionaryClient('gl').dashboard.admin}`,
      expectedEs: `${getDictionaryClient('es').dashboard.founder} · ${getDictionaryClient('es').dashboard.admin}`,
    },
  ])('renders localized role identity from profile.roles for $label', ({ roles, expectedGl, expectedEs }) => {
    const profile = buildProfile(roles);

    mockLocale = 'gl';
    const { unmount } = render(<ProfileDashboard profile={profile} user={mockUser} />);
    expect(screen.getByText(expectedGl)).toBeInTheDocument();
    unmount();

    mockLocale = 'es';
    render(<ProfileDashboard profile={profile} user={mockUser} />);
    expect(screen.getByText(expectedEs)).toBeInTheDocument();
  });

  it('fails closed to reader label when roles is []', () => {
    const glDict = getDictionaryClient('gl');
    render(
      <ProfileDashboard
        profile={buildProfile([])}
        user={mockUser}
      />
    );

    expect(screen.getByText(glDict.dashboard.reader)).toBeInTheDocument();
    expect(screen.queryByText(glDict.dashboard.founder)).not.toBeInTheDocument();
    expect(screen.queryByText(glDict.dashboard.admin)).not.toBeInTheDocument();
  });

  it('renders reader fallback when profile is null', () => {
    const glDict = getDictionaryClient('gl');
    render(<ProfileDashboard profile={null} user={mockUser} />);
    expect(screen.getByText(glDict.dashboard.reader)).toBeInTheDocument();
  });
});
