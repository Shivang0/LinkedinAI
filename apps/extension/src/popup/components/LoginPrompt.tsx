import React from 'react';

interface LoginPromptProps {
  onLogin: () => void;
}

export default function LoginPrompt({ onLogin }: LoginPromptProps) {
  return (
    <div className="login-prompt">
      <div className="login-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
        </svg>
      </div>

      <h2>Welcome to LinkedIn AI</h2>
      <p>Sign in to generate AI-powered comments for LinkedIn posts.</p>

      <div className="features-preview">
        <div className="feature">
          <span className="feature-bullet">&#9632;</span>
          Generate personalized comments
        </div>
        <div className="feature">
          <span className="feature-bullet">&#9632;</span>
          Choose from multiple tones
        </div>
        <div className="feature">
          <span className="feature-bullet">&#9632;</span>
          One-click insert into LinkedIn
        </div>
      </div>

      <button className="login-btn" onClick={onLogin}>
        Sign In
      </button>
    </div>
  );
}
