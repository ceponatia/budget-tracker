import React, { createContext, useContext, useState, useEffect } from 'react';
import { z } from 'zod';

const userSchema = z.object({ id: z.string(), email: z.string().email() });
export type User = z.infer<typeof userSchema> | null;

interface AuthContextValue {
  user: User;
  register(data: { email: string; password: string }): Promise<void>;
  login(data: { email: string; password: string }): Promise<void>;
  logout(): void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

async function api<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'API_ERROR');
  return json as T;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt refresh on mount if refresh token stored
    const stored = localStorage.getItem('refreshToken');
    if (stored && !user) {
      refresh(stored).catch(() => {/* ignore */});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function register(data: { email: string; password: string }) {
    setLoading(true);
    try {
      const result = await api<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
      handleAuthResult(result);
    } finally { setLoading(false); }
  }
  async function login(data: { email: string; password: string }) {
    setLoading(true);
    try {
      const result = await api<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
      handleAuthResult(result);
    } finally { setLoading(false); }
  }
  async function refresh(token: string) {
    try {
      const result = await api<{ accessToken: string; refreshToken: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: token }) });
      setAccessToken(result.accessToken);
      setRefreshToken(result.refreshToken);
      localStorage.setItem('refreshToken', result.refreshToken);
    } catch (e) {
      logout();
    }
  }
  function logout() {
    setUser(null); setAccessToken(null); setRefreshToken(null); localStorage.removeItem('refreshToken');
  }
  function handleAuthResult(r: { user: any; accessToken: string; refreshToken: string }) {
    const parsed = userSchema.safeParse(r.user);
    if (parsed.success) setUser(parsed.data); else setUser({ id: r.user.id, email: r.user.email });
    setAccessToken(r.accessToken); setRefreshToken(r.refreshToken);
    localStorage.setItem('refreshToken', r.refreshToken);
  }

  const value: AuthContextValue = { user, register, login, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
