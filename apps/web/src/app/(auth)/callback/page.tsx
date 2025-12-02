export default function CallbackPage() {
  // This page handles the OAuth callback redirect
  // The actual logic is in /api/auth/callback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-linkedin-blue border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
