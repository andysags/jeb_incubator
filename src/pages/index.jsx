import React, { useState } from 'react';
import { LoginPage } from './login';
import { AdminDashboard } from './AdminDashboard';

export default function Home() {
  const [page, setPage] = useState('login');
  const [role, setRole] = useState('guest');

  const handleNavigate = (nextPage) => {
    setPage(nextPage);
  };
  const handleLogin = (userRole) => {
    setRole(userRole);
    setPage(userRole === 'admin' ? 'adminDashboard' : 'login');
  };

  return (
    <>
      {page === 'login' && (
        <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />
      )}
      {page === 'adminDashboard' && (
        <AdminDashboard onNavigate={handleNavigate} />
      )}
    </>
  );
}
