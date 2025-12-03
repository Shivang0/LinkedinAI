'use client';

import { useEffect, useState } from 'react';
import { Gamepad2, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function ExtensionAuthorizePage() {
  const [status, setStatus] = useState<'loading' | 'authorizing' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    authorizeExtension();
  }, []);

  const authorizeExtension = async () => {
    try {
      // Request extension token from API
      const response = await fetch('/api/extension/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          // Not logged in - redirect to login
          window.location.href = '/login?redirect=/extension/authorize';
          return;
        }
        throw new Error(data.error || 'Failed to authorize extension');
      }

      const data = await response.json();
      setToken(data.token);
      setStatus('success');

      // Send token to extension via URL fragment
      // The extension can read this from the URL
      window.location.hash = `token=${data.token}&expiresAt=${data.expiresAt}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authorization failed');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setError(null);
    authorizeExtension();
  };

  return (
    <div className="min-h-screen bg-[#1a1c2c] flex items-center justify-center p-4">
      <div
        className="bg-[#262b44] border-4 border-[#f4f4f4] p-8 max-w-md w-full"
        style={{ boxShadow: '8px 8px 0 #0a0a0f' }}
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div
            className="w-12 h-12 bg-[#e43b44] border-4 border-[#f4f4f4] flex items-center justify-center"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <Gamepad2 className="w-6 h-6 text-[#f4f4f4]" />
          </div>
          <h1 className="font-pixel text-xl text-[#f4f4f4]">LinAI Extension</h1>
        </div>

        {/* Status */}
        <div className="text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#feae34] animate-spin" />
              <p className="font-retro text-xl text-[#94a3b8]">Connecting to your account...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-16 h-16 bg-[#63c74d] border-4 border-[#f4f4f4] flex items-center justify-center"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                <Check className="w-8 h-8 text-[#f4f4f4]" />
              </div>
              <h2 className="font-pixel text-sm text-[#63c74d]">CONNECTED!</h2>
              <p className="font-retro text-xl text-[#94a3b8]">
                The extension is now authorized. You can close this tab and start using AI comments on LinkedIn!
              </p>
              <div className="mt-4 p-4 bg-[#1a1c2c] border-2 border-[#3a4466] w-full">
                <p className="font-retro text-sm text-[#94a3b8]">
                  Token expires in 24 hours. The extension will prompt you to reconnect when needed.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-16 h-16 bg-[#e43b44] border-4 border-[#f4f4f4] flex items-center justify-center"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                <AlertCircle className="w-8 h-8 text-[#f4f4f4]" />
              </div>
              <h2 className="font-pixel text-sm text-[#e43b44]">ERROR</h2>
              <p className="font-retro text-xl text-[#94a3b8]">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-4 font-retro text-xl bg-[#e43b44] hover:bg-[#c42d35] text-[#f4f4f4] border-4 border-[#f4f4f4] px-6 py-3 transition-all"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-[#3a4466] text-center">
          <p className="font-retro text-sm text-[#94a3b8]">
            LinkedIn AI Comment Extension v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
