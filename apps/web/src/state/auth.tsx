import * as React from 'react';
import { z } from 'zod';

const userSchema = z.object({ id: z.string(), email: z.string().email() });
export type User = z.infer<typeof userSchema> | null;

interface AuthContextValue {
  user: User;
  register(data: { email: string; password: string }): Promise<void>;
  login(data: { email: string; password: string }): Promise<void>;
  logout(): void;
  loading: boolean;
  accessToken: string | null;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

// Access Vite env safely (avoid 'any' while tolerating absence)
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ??
  'http://localhost:3000';

async function api<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
  const json: unknown = await res.json().catch(() => ({}) as unknown);
  if (!res.ok) {
    let message = 'API_ERROR';
    if (typeof json === 'object' && json && 'error' in json) {
      const errVal = (json as { error?: unknown }).error;
      if (typeof errVal === 'string') message = errVal;
    }
    throw new Error(message);
  }
  return json as T; // trusted boundary after status ok
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User>(null);
  // Underscore to intentionally keep (future use for authorized requests)
  const [_accessToken, setAccessToken] = React.useState<string | null>(null);
  const [_refreshToken, setRefreshToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Attempt refresh on mount if refresh token stored
    const stored = localStorage.getItem('refreshToken');
    if (stored && !user) {
      refresh(stored).catch(() => {
        /* ignore */
      });
    }
  }, []);

  const register = React.useCallback(async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await api<{
        user: { id: string; email: string };
        accessToken: string;
        refreshToken: string;
      }>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
      handleAuthResult(result);
    } finally {
      setLoading(false);
    }
  }, []);
  const login = React.useCallback(async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await api<{
        user: { id: string; email: string };
        accessToken: string;
        refreshToken: string;
      }>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
      handleAuthResult(result);
    } finally {
      setLoading(false);
    }
  }, []);
  const refresh = React.useCallback(async (token: string) => {
    try {
      const result = await api<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token }),
      });
      setAccessToken(result.accessToken);
      setRefreshToken(result.refreshToken);
      localStorage.setItem('refreshToken', result.refreshToken);
    } catch {
      logout();
    }
  }, []);
  const logout = React.useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('refreshToken');
  }, []);
  function handleAuthResult(r: {
    user: { id: string; email: string };
    accessToken: string;
    refreshToken: string;
  }) {
    const parsed = userSchema.safeParse(r.user);
    if (parsed.success) setUser(parsed.data);
    else setUser({ id: r.user.id, email: r.user.email });
    setAccessToken(r.accessToken);
    setRefreshToken(r.refreshToken);
    localStorage.setItem('refreshToken', r.refreshToken);
  }

  const value: AuthContextValue = {
    user,
    register,
    login,
    logout,
    loading,
    accessToken: _accessToken,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
