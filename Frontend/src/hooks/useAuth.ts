import { useEffect, useState, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, fetchMe, getToken } from '../services/authService';

interface User {
  id: string;
  email: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!getToken()) { setUser(null); return; }
      const me = await fetchMe();
      setUser(me);
    } catch (e: unknown) {
      setUser(null);
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
    await loadMe();
  }, [loadMe]);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return { user, loading, error, login, logout, refresh: loadMe };
}

