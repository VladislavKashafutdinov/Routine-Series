import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { fetchMe, verifyLoginCode } from '@/api/auth';
import { saveTokens } from '@/api/tokens';
import type { ApiUser } from '@/api/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: ApiUser | null;
  /** Verifies the login code; on success stores the tokens and switches to authenticated. */
  verify: (email: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Checks the session on app start by calling /auth/me (the access token from
 * localStorage is attached by apiFetch) and exposes the result: authenticated
 * (with user), unauthenticated, or loading. Any failure resolves to
 * unauthenticated — token refresh arrives in a later feature.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'verify'>>({ status: 'loading', user: null });

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

  const verify = useCallback(async (email: string, code: string) => {
    const res = await verifyLoginCode(email, code);
    saveTokens(res.access_token, res.refresh_token);
    setState({ status: 'authenticated', user: res.user });
  }, []);

  return <AuthContext.Provider value={{ ...state, verify }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
