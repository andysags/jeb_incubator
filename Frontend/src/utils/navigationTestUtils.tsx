// Utilitaire pour tester les différents types d'utilisateurs
// À utiliser uniquement en développement

export const simulateUserLogin = (userType: 'public' | 'startup' | 'investor' | 'partner' | 'admin') => {
  // Simuler un token pour les tests
  const fakeToken = `fake-token-${userType}-${Date.now()}`;
  
  if (userType === 'public') {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
  } else {
    localStorage.setItem('token', fakeToken);
    localStorage.setItem('userType', userType);
  }
  
  // Recharger la page pour voir les changements
  window.location.reload();
};

// Composant de test pour la navbar personnalisée
export const NavigationTestPanel = () => {
  const userTypes: Array<{type: 'public' | 'startup' | 'investor' | 'partner' | 'admin', label: string}> = [
    { type: 'public', label: 'Public (Non connecté)' },
    { type: 'startup', label: 'Startup' },
    { type: 'investor', label: 'Investor' },
    { type: 'partner', label: 'Partner' },
    { type: 'admin', label: 'Admin' },
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
      <h3 className="text-sm font-bold mb-3 text-gray-800">Test Navigation</h3>
      <div className="space-y-2">
        {userTypes.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => simulateUserLogin(type)}
            className="block w-full text-left px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
        Mode développement uniquement
      </div>
    </div>
  );
};
