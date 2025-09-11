import { useState, useEffect } from 'react';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface UserProfile {
  type: 'public' | 'startup' | 'investor' | 'partner' | 'admin';
  isAuthenticated: boolean;
}

export const usePersonalizedNavigation = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    type: 'public',
    isAuthenticated: false
  });

  // Fonction pour obtenir le profil utilisateur depuis le localStorage ou API
  const getUserProfile = (): UserProfile => {
    try {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  // tolerate older stored role 'founder' by mapping it to 'startup'
  let userType = localStorage.getItem('userType') as string | null;
  if (userType === 'founder') userType = 'startup';
  const userTypeTyped = (userType as UserProfile['type']) || null;
      
      if (token && userTypeTyped) {
        return {
          type: userTypeTyped,
          isAuthenticated: true
        };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
    }
    
    return {
      type: 'public',
      isAuthenticated: false
    };
  };

  // Navigation personnalisée selon le profil
  const getNavigationItems = (profile: UserProfile): NavigationItem[] => {
    switch (profile.type) {
      case 'public':
        return [
          { id: 'home', label: 'Home', href: '/' },
          { id: 'startups', label: 'Startups', href: '/StartupsPage' },
          { id: 'news', label: 'News', href: '/NewsPage' },
          { id: 'events', label: 'Events', href: '/EventsPage' },
          { id: 'opportunities', label: 'Opportunities', href: '/OpportunitiesPage' },
        ];

      case 'investor':
        return [
          { id: 'home', label: 'Home', href: '/' },
          { id: 'startups', label: 'Startups', href: '/StartupsPage' },
          { id: 'news', label: 'News', href: '/NewsPage' },
          { id: 'events', label: 'Events', href: '/EventsPage' },
          { id: 'opportunities', label: 'Opportunities', href: '/OpportunitiesPage' },
          { id: 'messages', label: 'Messages', href: '/MessagePage' },
          // replace profile shortcut for investors with events (UX decision)
        ];

      case 'partner':
        return [
          { id: 'home', label: 'Home', href: '/' },
          { id: 'startups', label: 'Startups', href: '/StartupsPage' },
          { id: 'opportunities', label: 'Opportunities', href: '/OpportunitiesPage' },
        ];

      case 'startup':
        return [
          { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
          { id: 'messages', label: 'Messages', href: '/MessagePage' },
          { id: 'news', label: 'News', href: '/NewsPage' },
          { id: 'opportunities', label: 'Opportunities', href: '/OpportunitiesPage' },
          
          // replace profile with events for startup users
          { id: 'events', label: 'Events', href: '/EventsPage' },
        ];

      case 'admin':
        // Admins should not see the messaging item
        return [
          { id: 'adminDashboard', label: 'Admin Dashboard', href: '/AdminDashboard' },
          { id: 'opportunities', label: 'Opportunities', href: '/OpportunitiesPage' },
          { id: 'news', label: 'News', href: '/NewsPage' },
          { id: 'events', label: 'Events', href: '/EventsPage' },
        ];

      default:
        return [
          { id: 'home', label: 'Home', href: '/' },
          { id: 'startups', label: 'Startups', href: '/StartupsPage' },
          { id: 'news', label: 'News', href: '/NewsPage' },
          { id: 'events', label: 'Events', href: '/EventsPage' },
        ];
    }
  };

  // Actions utilisateur selon le profil
  const getUserActions = (profile: UserProfile) => {
    if (profile.isAuthenticated) {
      return [
        { id: 'profile', label: 'Profile', href: '/profile' },
        { id: 'logout', label: 'Logout', href: '#', action: 'logout' },
      ];
    } else {
      return [
        { id: 'login', label: 'Login', href: '/login' },
        { id: 'signup', label: 'Register', href: '/SignupPage' },
      ];
    }
  };

  // Fonction de déconnexion
  const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('userType');
    setUserProfile({
      type: 'public',
      isAuthenticated: false
    });
    window.location.href = '/';
  };

  // Mise à jour du profil utilisateur
  const updateUserProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    if (newProfile.isAuthenticated) {
      localStorage.setItem('userType', newProfile.type);
    }
  };

  // Effet pour charger le profil au montage
  useEffect(() => {
    const syncProfile = () => {
      const profile = getUserProfile();
      setUserProfile(profile);
    };

    // initial load
    syncProfile();

    // keep in sync when other tabs update localStorage or when we dispatch a custom event
    const handler = () => syncProfile();
    window.addEventListener('storage', handler);
    window.addEventListener('jeb_auth_changed', handler as EventListener);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('jeb_auth_changed', handler as EventListener);
    };
  }, []);

  return {
    userProfile,
    navigationItems: getNavigationItems(userProfile),
    userActions: getUserActions(userProfile),
    updateUserProfile,
    handleLogout,
  };
};

export default usePersonalizedNavigation;
