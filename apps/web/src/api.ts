/**
 * Shared API base + helper for web app (centralizes env resolution)
 */
// Access Vite env safely (avoid implicit any)
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ??
  'http://localhost:3000';

export function apiFetch(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const headers: Record<string, string> = {};
  if (init.headers) {
    for (const [k, v] of Object.entries(init.headers as Record<string, string>)) headers[k] = v;
  }
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
