import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { fetchMe } from '@/api/auth';
import type { ApiUser } from '@/api/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: ApiUser | null;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Checks the session on app start by calling /auth/me and exposes the
 * result: authenticated (with user), unauthenticated, or loading.
 * Any failure (401 or network) resolves to unauthenticated for now —
 * token refresh arrives in a later feature.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((user) => {
        if (!cancelled) setState({ status: 'authenticated', user });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unauthenticated', user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
