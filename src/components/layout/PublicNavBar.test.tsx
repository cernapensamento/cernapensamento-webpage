import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicNavBar from './PublicNavBar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getDictionaryClient } from '@/dictionaries/client';
import {
  PERMISSIONS,
  USER_ROLES,
  resolvePermissionsForRoles,
} from '@/lib/db/schema';
import type { AuthProfile } from '@/lib/db/types';

const glDict = getDictionaryClient('gl');

let mockPathname = '/gl/articulos';
let mockAuthState: {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null;
  profile: AuthProfile | null;
  loading: boolean;
} = {
  user: null,
  profile: null,
  loading: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockPathname,
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

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

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/actions/auth', () => ({
  handleSignOut: vi.fn(),
}));

function renderNav() {
  return render(
    <ThemeProvider>
      <PublicNavBar />
    </ThemeProvider>
  );
}

describe('PublicNavBar atomic permission gating & role badge resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/gl/articulos';
    mockAuthState = {
      user: { id: 'u-1', email: 'test@cerna.org', user_metadata: {} },
      profile: null,
      loading: false,
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('hides Writer Desk and new-article links when user is authenticated but profile is still null (no null-profile flash)', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }));

    expect(screen.getByRole('menuitem', { name: new RegExp(glDict.nav.userMenu.profile, 'i') })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: new RegExp(glDict.nav.userMenu.myArticles, 'i') })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: new RegExp(glDict.nav.userMenu.newArticle, 'i') })).not.toBeInTheDocument();
  });

  it.each([
    {
      label: 'reader',
      roles: [USER_ROLES.READER],
      permissions: resolvePermissionsForRoles([USER_ROLES.READER]),
      expectedBadge: 'LECTOR',
    },
    {
      label: 'zero-role',
      roles: [],
      permissions: [],
      expectedBadge: 'LECTOR',
    },
    {
      label: 'custom pin-only without desk:access',
      roles: [],
      permissions: [PERMISSIONS.PUBLICATIONS_PIN],
      expectedBadge: 'LECTOR',
    },
    {
      label: 'custom review-only without desk:access',
      roles: [],
      permissions: [PERMISSIONS.PUBLICATIONS_REVIEW],
      expectedBadge: 'LECTOR',
    },
  ])('denies Writer Desk links for $label user', async ({ roles, permissions, expectedBadge }) => {
    const user = userEvent.setup();
    mockAuthState.profile = {
      roles,
      permissions,
      avatar_url: null,
      full_name: 'Lectora',
    };

    renderNav();
    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }));

    expect(screen.getByText(expectedBadge)).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: new RegExp(glDict.nav.userMenu.profile, 'i') })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: new RegExp(glDict.nav.userMenu.myArticles, 'i') })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: new RegExp(glDict.nav.userMenu.newArticle, 'i') })).not.toBeInTheDocument();
  });

  it.each([
    {
      label: 'guest',
      roles: [USER_ROLES.GUEST],
      permissions: resolvePermissionsForRoles([USER_ROLES.GUEST]),
      expectedBadge: 'CONVIDADO',
    },
    {
      label: 'member',
      roles: [USER_ROLES.MEMBER],
      permissions: resolvePermissionsForRoles([USER_ROLES.MEMBER]),
      expectedBadge: 'MEMBRO',
    },
    {
      label: 'founder',
      roles: [USER_ROLES.FOUNDER],
      permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER]),
      expectedBadge: 'FUNDADOR',
    },
    {
      label: 'admin',
      roles: [USER_ROLES.ADMIN],
      permissions: resolvePermissionsForRoles([USER_ROLES.ADMIN]),
      expectedBadge: 'ADMIN',
    },
    {
      label: 'overlapping guest + member',
      roles: [USER_ROLES.GUEST, USER_ROLES.MEMBER],
      permissions: resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]),
      expectedBadge: 'MEMBRO',
    },
    {
      label: 'overlapping founder + admin',
      roles: [USER_ROLES.FOUNDER, USER_ROLES.ADMIN],
      permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]),
      expectedBadge: 'FUNDADOR',
    },
    {
      label: 'custom desk:access only',
      roles: [],
      permissions: [PERMISSIONS.DESK_ACCESS],
      expectedBadge: 'LECTOR',
    },
  ])('shows Writer Desk and new-article links for $label user', async ({ roles, permissions, expectedBadge }) => {
    const user = userEvent.setup();
    mockAuthState.profile = {
      roles,
      permissions,
      avatar_url: null,
      full_name: 'Escritora',
    };

    renderNav();
    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }));

    expect(screen.getByText(expectedBadge)).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: new RegExp(glDict.nav.userMenu.profile, 'i') })).toHaveAttribute('href', '/gl/escritorio/perfil');
    expect(screen.getByRole('menuitem', { name: new RegExp(glDict.nav.userMenu.myArticles, 'i') })).toHaveAttribute('href', '/gl/escritorio');
    expect(screen.getByRole('menuitem', { name: new RegExp(glDict.nav.userMenu.newArticle, 'i') })).toHaveAttribute('href', '/gl/escritorio/nuevo');
  });
});
