import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import * as authClient from '@/lib/auth-client';
import { createClient } from '@/lib/supabase/client';

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

    vi.mocked(authClient.fetchClientAuthProfile).mockResolvedValue({
      role: 'admin',
      avatar_url: 'https://example.com/avatar.webp',
      full_name: 'Pablo Admin',
    });
  });

  it('provides safe default values when consumed outside AuthProvider', () => {
    render(<ConsumerA />);
    expect(screen.getByTestId('consumer-a-loading').textContent).toBe('false');
    expect(screen.getByTestId('consumer-a-user').textContent).toBe('no-user');
    expect(screen.getByTestId('consumer-a-role').textContent).toBe('no-role');
  });

  it('loads session and profile once, sharing identical state with all consumers', async () => {
    render(
      <AuthProvider>
        <ConsumerA />
        <ConsumerB />
      </AuthProvider>
    );

    // Initial loading state while async loadSession runs
    await act(async () => {
      // allow promises to resolve
      await Promise.resolve();
    });

    expect(screen.getByTestId('consumer-a-user').textContent).toBe('usr-123');
    expect(screen.getByTestId('consumer-b-user').textContent).toBe('usr-123');
    expect(screen.getByTestId('consumer-a-role').textContent).toBe('admin');
    expect(screen.getByTestId('consumer-b-role').textContent).toBe('admin');

    // Crucial: single database query for both consumers
    expect(authClient.fetchClientAuthProfile).toHaveBeenCalledTimes(1);
    expect(authClient.fetchClientAuthProfile).toHaveBeenCalledWith('usr-123', expect.anything());
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

    // Simulate logout
    await act(async () => {
      if (authStateCallback) {
        authStateCallback('SIGNED_OUT', null);
      }
    });

    expect(screen.getByTestId('consumer-a-user').textContent).toBe('no-user');
    expect(screen.getByTestId('consumer-b-user').textContent).toBe('no-user');
    expect(screen.getByTestId('consumer-a-role').textContent).toBe('no-role');
    expect(screen.getByTestId('consumer-b-role').textContent).toBe('no-role');
  });
});
