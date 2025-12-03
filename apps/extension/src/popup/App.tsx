import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/types/messages';
import AuthStatus from './components/AuthStatus';
import LoginPrompt from './components/LoginPrompt';

interface UserInfo {
  name: string;
  email: string;
  accountStatus: string;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await sendMessage({ type: 'CHECK_AUTH', payload: undefined });
      setIsAuthenticated(response.authenticated);
      if (response.authenticated && response.user) {
        setUser({
          name: response.user.name,
          email: response.user.email,
          accountStatus: response.user.accountStatus,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    await sendMessage({ type: 'LOGIN', payload: undefined });
    window.close();
  };

  const handleLogout = async () => {
    await sendMessage({ type: 'LOGOUT', payload: undefined });
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="popup-loading">
          <div className="loading-spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="popup-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L3 9l9 6 9-6-9-6z"/>
            <path d="M3 9v6l9 6 9-6V9" opacity="0.5"/>
          </svg>
          <span>LinkedIn AI</span>
        </div>
      </header>

      <main className="popup-content">
        {isAuthenticated && user ? (
          <AuthStatus user={user} onLogout={handleLogout} />
        ) : (
          <LoginPrompt onLogin={handleLogin} />
        )}
      </main>

      <footer className="popup-footer">
        <a href="https://linekdin.vercel.app" target="_blank" rel="noopener noreferrer">
          Open Dashboard
        </a>
      </footer>
    </div>
  );
}
