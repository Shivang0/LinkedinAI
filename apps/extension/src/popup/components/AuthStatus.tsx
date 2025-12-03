import React from 'react';

interface AuthStatusProps {
  user: {
    name: string;
    email: string;
    accountStatus: string;
  };
  onLogout: () => void;
}

export default function AuthStatus({ user, onLogout }: AuthStatusProps) {
  const isActive = user.accountStatus === 'active';

  return (
    <div className="auth-status">
      <div className="user-info">
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <div className="user-name">{user.name}</div>
          <div className="user-email">{user.email}</div>
        </div>
      </div>

      <div className={`subscription-status ${isActive ? 'active' : 'inactive'}`}>
        <span className="status-dot"></span>
        <span>{isActive ? 'Active Subscription' : 'No Active Subscription'}</span>
      </div>

      {isActive ? (
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">&#10003;</span>
            <span>AI Comment Generation</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">&#10003;</span>
            <span>Personalized Comments</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">&#10003;</span>
            <span>Multiple Tone Options</span>
          </div>
        </div>
      ) : (
        <div className="upgrade-prompt">
          <p>Upgrade to generate AI-powered comments.</p>
          <a href="https://linekdin.vercel.app/settings/billing" target="_blank" rel="noopener noreferrer" className="upgrade-btn">
            Upgrade Now
          </a>
        </div>
      )}

      <button className="logout-btn" onClick={onLogout}>
        Sign Out
      </button>
    </div>
  );
}
