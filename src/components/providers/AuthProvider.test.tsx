import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import * as authClient from '@/lib/auth-client';
import { createClient } from '@/lib/supabase/client';
import { PERMISSIONS, USER_ROLES, resolvePermissionsForRoles } from '@/lib/db/schema';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  fetchClientAuthProfile: vi.fn(),
}));

function ConsumerA() {
  const { user, profile, loading } = useAuth();
  return (
    <div>
      <span data-testid="consumer-a-loading">{String(loading)}</span>
      <span data-testid="consumer-a-user">{user?.id || 'no-user'}</span>
      <span data-testid="consumer-a-role">{profile?.role || 'no-role'}</span>
      <span data-testid="consumer-a-roles">{profile?.roles?.join(',') || 'no-roles'}</span>
      <span data-testid="consumer-a-perms">{profile?.permissions?.join(',') || 'no-perms'}</span>
    </div>
  );
}

function ConsumerB() {
  const { user, profile, loading } = useAuth();
  return (
    <div>
      <span data-testid="consumer-b-loading">{String(loading)}</span>
      <span data-testid="consumer-b-user">{user?.id || 'no-user'}</span>
      <span data-testid="consumer-b-role">{profile?.role || 'no-role'}</span>
      <span data-testid="consumer-b-roles">{profile?.roles?.join(',') || 'no-roles'}</span>
    </div>
  );
}

describe('AuthProvider & useAuth Integration', () => {
  const mockUnsubscribe = vi.fn();
  let authStateCallback: ((event: string, session: unknown) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'usr-123', app_metadata: { user_role: 'member' } },
            },
          },
        }),
        onAuthStateChange: vi.fn().mockImplementation((cb) => {
          authStateCallback = cb;
          return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        }),
      },
    } as unknown as ReturnType<typeof createClient>);

    const founderAdminPerms = resolvePermissionsForRoles([
      USER_ROLES.FOUNDER,
      USER_ROLES.ADMIN,
    ]);
    vi.mocked(authClient.fetchClientAuthProfile).mockResolvedValue({
      roles: [USER_ROLES.FOUNDER, USER_ROLES.ADMIN],
      permissions: founderAdminPerms,
      role: USER_ROLES.ADMIN,
      rol: USER_ROLES.ADMIN,
      avatar_url: 'https://example.com/avatar.webp',
      full_name: 'Pablo Admin',
    });
  });

  it('provides safe default values when consumed outside AuthProvider', () => {
    render(<ConsumerA />);
    expect(screen.getByTestId('consumer-a-loading').textContent).toBe('false');
    expect(screen.getByTestId('consumer-a-user').textContent).toBe('no-user');
    expect(screen.getByTestId('consumer-a-role').textContent).toBe('no-role');
    expect(screen.getByTestId('consumer-a-roles').textContent).toBe('no-roles');
    expect(screen.getByTestId('consumer-a-perms').textContent).toBe('no-perms');
  });

  it('loads session and DB profile once, sharing roles and permissions across all consumers', async () => {
    render(
      <AuthProvider>
        <ConsumerA />
        <ConsumerB />
      </AuthProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('consumer-a-user').textContent).toBe('usr-123');
    expect(screen.getByTestId('consumer-b-user').textContent).toBe('usr-123');
    expect(screen.getByTestId('consumer-a-role').textContent).toBe('admin');
    expect(screen.getByTestId('consumer-b-role').textContent).toBe('admin');
    expect(screen.getByTestId('consumer-a-roles').textContent).toBe('founder,admin');
    expect(screen.getByTestId('consumer-b-roles').textContent).toBe('founder,admin');
    expect(screen.getByTestId('consumer-a-perms').textContent).toContain(
      PERMISSIONS.USERS_ASSIGN_ROLE
    );

    expect(authClient.fetchClientAuthProfile).toHaveBeenCalledTimes(1);
    expect(authClient.fetchClientAuthProfile).toHaveBeenCalledWith('usr-123', expect.anything());
  });

  it('ignores JWT app_metadata.user_role when DB returns empty roles and zero permissions', async () => {
    vi.mocked(authClient.fetchClientAuthProfile).mockResolvedValue({
      roles: [],
      permissions: [],
      role: USER_ROLES.READER,
      rol: USER_ROLES.READER,
      avatar_url: null,
      full_name: 'Zero Role User',
    });

    render(
      <AuthProvider>
        <ConsumerA />
      </AuthProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('consumer-a-role').textContent).toBe('reader');
    expect(screen.getByTestId('consumer-a-roles').textContent).toBe('no-roles');
    expect(screen.getByTestId('consumer-a-perms').textContent).toBe('no-perms');
  });

  it('keeps profile null when fetchClientAuthProfile returns null even if JWT has app_metadata.user_role', async () => {
    vi.mocked(authClient.fetchClientAuthProfile).mockResolvedValue(null);

    render(
      <AuthProvider>
        <ConsumerA />
      </AuthProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('consumer-a-user').textContent).toBe('usr-123');
    expect(screen.getByTestId('consumer-a-role').textContent).toBe('no-role');
    expect(screen.getByTestId('consumer-a-roles').textContent).toBe('no-roles');
    expect(screen.getByTestId('consumer-a-perms').textContent).toBe('no-perms');
  });

  it('updates all consumers simultaneously on auth state change (e.g. sign out)', async () => {
    render(
      <AuthProvider>
        <ConsumerA />
        <ConsumerB />
      </AuthProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('consumer-a-user').textContent).toBe('usr-123');

    await act(async () => {
      if (authStateCallback) {
        authStateCallback('SIGNED_OUT', null);
      }
    });

    expect(screen.getByTestId('consumer-a-user').textContent).toBe('no-user');
    expect(screen.getByTestId('consumer-b-user').textContent).toBe('no-user');
    expect(screen.getByTestId('consumer-a-role').textContent).toBe('no-role');
    expect(screen.getByTestId('consumer-b-role').textContent).toBe('no-role');
    expect(screen.getByTestId('consumer-a-roles').textContent).toBe('no-roles');
    expect(screen.getByTestId('consumer-a-perms').textContent).toBe('no-perms');
  });
});
