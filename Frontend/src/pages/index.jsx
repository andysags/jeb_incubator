import React, { useState, useEffect } from 'react';
import HomePage from './HomePage';
import LoginPage from './login';
import { AdminDashboard } from './AdminDashboard';
import MessagingPage from './MessagePage';
import EventsPage from './EventsPage';
// Header is rendered globally in _app.tsx
import { Header } from '../components/Header';
import { useRouter } from 'next/router';
import usePersonalizedNavigation from '../hooks/usePersonalizedNavigation';

export default function Home() {
  const router = useRouter();
  const { userProfile } = usePersonalizedNavigation();
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    setIsLoading(false);
  }, [userProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        {/* HomePage est publique : accessible connecté ou non */}
        <HomePage />
      </main>
    </div>
  );
}