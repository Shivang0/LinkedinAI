import Link from 'next/link';
import { Gamepad2, ArrowLeft, Star } from 'lucide-react';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <div className="min-h-screen bg-[#1a1c2c] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#f4f4f4]"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 31) % 100}%`,
              opacity: 0.3 + (i % 3) * 0.2,
            }}
          />
        ))}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div
            className="w-16 h-16 bg-[#e43b44] border-4 border-[#f4f4f4] flex items-center justify-center"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <Gamepad2 className="w-8 h-8 text-[#f4f4f4]" />
          </div>
        </div>
        <h2 className="mt-6 text-center font-pixel text-sm md:text-base text-[#f4f4f4] text-shadow-pixel">
          SIGN IN TO LinAI
        </h2>
        <p className="mt-4 text-center font-retro text-xl text-[#94a3b8]">
          Create engaging LinkedIn posts with AI
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] py-8 px-6"
          style={{ boxShadow: '8px 8px 0 #0a0a0f' }}
        >
          {error && (
            <div className="mb-6 p-4 bg-[#e43b44]/20 border-4 border-[#e43b44]">
              <p className="font-retro text-lg text-[#e43b44]">
                {error === 'auth_failed'
                  ? 'Authentication failed. Please try again.'
                  : error === 'invalid_state'
                  ? 'Invalid state. Please try again.'
                  : error === 'no_code'
                  ? 'Authorization failed. Please try again.'
                  : 'An error occurred. Please try again.'}
              </p>
            </div>
          )}

          <div className="space-y-6">
            <a
              href="/api/auth/linkedin"
              className="w-full flex justify-center items-center gap-3 font-retro text-xl bg-[#0099db] hover:bg-[#0077a8] text-[#f4f4f4] border-4 border-[#f4f4f4] px-6 py-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
              style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
            >
              <LinkedInIcon />
              Sign in with LinkedIn
            </a>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#3a4466]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#262b44] font-retro text-base text-[#94a3b8]">
                  Secure OAuth authentication
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="font-retro text-lg text-[#94a3b8]">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-[#feae34] hover:text-[#f4f4f4] transition-colors">
                  Terms of Service
                </Link>
                ,{' '}
                <Link href="/privacy" className="text-[#feae34] hover:text-[#f4f4f4] transition-colors">
                  Privacy Policy
                </Link>
                {' '}and{' '}
                <Link href="/refund" className="text-[#feae34] hover:text-[#f4f4f4] transition-colors">
                  Refund Policy
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-[#3a4466]">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-4 h-4 text-[#feae34]" />
                <p className="font-retro text-xl text-[#63c74d]">
                  $19/month for unlimited AI posts
                </p>
                <Star className="w-4 h-4 text-[#feae34]" />
              </div>
              <p className="font-retro text-base text-[#94a3b8]">
                Payment required after sign in
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-retro text-lg text-[#94a3b8] hover:text-[#feae34] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
