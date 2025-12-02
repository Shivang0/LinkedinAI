import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'development-secret-change-me'
);

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/compose', '/drafts', '/calendar', '/templates', '/settings'];

// Routes that require payment (active subscription)
const paidRoutes = ['/dashboard', '/compose', '/drafts', '/calendar', '/templates'];

// Public routes (no auth required)
const publicRoutes = ['/', '/login', '/callback', '/api/auth', '/api/webhooks'];

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
      return NextResponse.next();
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

    return NextResponse.next();
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
