import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ReactNode } from 'react';

export function RequireRole({ role, children }: { role?: string; children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (role && user.role !== role) router.replace('/');
    }
  }, [user, loading, role, router]);

  if (loading || !user || (role && user.role !== role)) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }
  return children;
}

