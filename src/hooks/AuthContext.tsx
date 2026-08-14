import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { fetchMe, logout as apiLogout, verifyLoginCode } from '@/api/auth';
import { clearTokens, saveTokens, setUnauthorizedHandler } from '@/api/tokens';
import type { ApiUser } from '@/api/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: ApiUser | null;
  /** Verifies the login code; on success stores the tokens and switches to authenticated. */
  verify: (email: string, code: string) => Promise<void>;
  /** Logs out: asks the server to delete the session and clears local tokens. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Checks the session on app start by calling /auth/me (the access token from
 * localStorage is attached by apiFetch; an expired access token is refreshed
 * transparently). Any unrecoverable failure resolves to unauthenticated.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'verify' | 'logout'>>({ status: 'loading', user: null });

  useEffect(() => {
    let cancelled = false;
    // When a request can't be restored after a 401 (refresh failed), the
    // session is gone — drop to unauthenticated.
    setUnauthorizedHandler(() => {
      if (!cancelled) setState({ status: 'unauthenticated', user: null });
    });
    fetchMe()
      .then((user) => {
        if (!cancelled) setState({ status: 'authenticated', user });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unauthenticated', user: null });
      });
    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, []);

  const verify = useCallback(async (email: string, code: string) => {
    const res = await verifyLoginCode(email, code);
    saveTokens(res.access_token, res.refresh_token);
    setState({ status: 'authenticated', user: res.user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Server unreachable — clear the local session anyway.
    }
    clearTokens();
    setState({ status: 'unauthenticated', user: null });
  }, []);

  return <AuthContext.Provider value={{ ...state, verify, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
