import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'development-secret-change-me'
);

const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days in seconds
const SESSION_REFRESH_THRESHOLD = 60 * 60 * 24 * 15; // Refresh if less than 15 days remaining

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/compose', '/drafts', '/calendar', '/templates', '/settings'];

// Routes that require payment (active subscription)
const paidRoutes = ['/dashboard', '/compose', '/drafts', '/calendar', '/templates'];

// Public routes (no auth required)
const publicRoutes = ['/', '/login', '/callback', '/api/auth', '/api/webhooks'];

/**
 * Refreshes the session cookie if it's getting close to expiring (sliding session)
 * This keeps active users logged in indefinitely
 */
async function maybeRefreshSession(
  payload: Record<string, unknown>,
  response: NextResponse
): Promise<void> {
  const exp = payload.exp as number;
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = exp - now;

  // Only refresh if less than 15 days remaining
  if (timeRemaining >= SESSION_REFRESH_THRESHOLD) {
    return;
  }

  // Create a new token with fresh expiration
  const newToken = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    profileImageUrl: payload.profileImageUrl,
    accountStatus: payload.accountStatus,
    subscription: payload.subscription,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);

  // Set the refreshed cookie
  response.cookies.set('session', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow API routes except protected ones
  if (pathname.startsWith('/api/')) {
    // Webhook routes are public
    if (pathname.startsWith('/api/webhooks')) {
      return NextResponse.next();
    }
    // Auth routes are public
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    // Other API routes need session check on the route itself
    return NextResponse.next();
  }

  // Check for session token
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    // No session, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the token
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const accountStatus = payload.accountStatus as string;

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!isProtectedRoute) {
      // Still check if session needs refresh for non-protected routes
      const response = NextResponse.next();
      await maybeRefreshSession(payload, response);
      return response;
    }

    // Check account status for paid routes
    const isPaidRoute = paidRoutes.some((route) => pathname.startsWith(route));

    if (isPaidRoute) {
      // Redirect pending payment users to checkout
      if (accountStatus === 'pending_payment') {
        return NextResponse.redirect(new URL('/checkout', request.url));
      }

      // Redirect suspended users to billing
      if (accountStatus === 'suspended') {
        return NextResponse.redirect(new URL('/settings/billing?suspended=true', request.url));
      }

      // Redirect canceled users to resubscribe
      if (accountStatus === 'canceled') {
        return NextResponse.redirect(new URL('/checkout?resubscribe=true', request.url));
      }
    }

    // Refresh session if needed (sliding session)
    const response = NextResponse.next();
    await maybeRefreshSession(payload, response);
    return response;
  } catch {
    // Invalid token, clear and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/webhooks).*)',
  ],
};
