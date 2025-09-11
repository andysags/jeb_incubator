import { apiFetch } from './api';

const TOKEN_KEY = 'auth_token';

export type LoginResponse = { access: string };

export async function login(email: string, password: string): Promise<void> {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }) as LoginResponse;
  localStorage.setItem(TOKEN_KEY, data.access);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export async function fetchMe() {
  const token = getToken();
  if (!token) throw new Error('Non authentifié');
  return apiFetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

