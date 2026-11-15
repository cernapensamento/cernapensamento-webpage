'use client';

import { useContext } from 'react';
import { AuthContext, type Profile, type AuthContextValue } from '@/components/providers/AuthProvider';

export type { Profile, AuthContextValue };

/**
 * Access the shared authentication state from AuthProvider.
 * If used outside AuthProvider, safely returns a unauthenticated fallback.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
