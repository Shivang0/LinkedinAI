import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { Session } from '@linkedin-ai/shared';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'development-secret-change-me'
);
const SESSION_COOKIE = 'session';
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days in seconds
const SESSION_REFRESH_THRESHOLD = 60 * 60 * 24 * 15; // Refresh if less than 15 days remaining

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  profileImageUrl?: string | null;
  accountStatus: string;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
  exp: number;
  iat: number;
}

/**
 * Creates a JWT session token
 */
export async function createSessionToken(session: Session): Promise<string> {
  const token = await new SignJWT({
    userId: session.userId,
    email: session.email,
    name: session.name,
    profileImageUrl: session.profileImageUrl,
    accountStatus: session.accountStatus,
    subscription: session.subscription
      ? {
          plan: session.subscription.plan,
          status: session.subscription.status,
          currentPeriodEnd: session.subscription.currentPeriodEnd.toISOString(),
        }
      : null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verifies and decodes a JWT session token
 */
export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Sets the session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

/**
 * Gets the current session from cookie
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Clears the session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Refreshes the session with updated data
 */
export async function refreshSession(updates: Partial<Session>): Promise<void> {
  const currentSession = await getSession();
  if (!currentSession) {
    return;
  }

  const session: Session = {
    userId: currentSession.userId,
    email: currentSession.email,
    name: currentSession.name,
    profileImageUrl: currentSession.profileImageUrl,
    accountStatus: currentSession.accountStatus as Session['accountStatus'],
    subscription: currentSession.subscription
      ? {
          plan: currentSession.subscription.plan as 'premium_monthly' | 'premium_annual',
          status: currentSession.subscription.status as 'active' | 'past_due' | 'canceled',
          currentPeriodEnd: new Date(currentSession.subscription.currentPeriodEnd),
        }
      : null,
    ...updates,
  };

  const token = await createSessionToken(session);
  await setSessionCookie(token);
}

/**
 * Checks if a session token needs to be refreshed (sliding session)
 * Returns true if the token has less than SESSION_REFRESH_THRESHOLD remaining
 */
export function shouldRefreshSession(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = payload.exp - now;
  return timeRemaining < SESSION_REFRESH_THRESHOLD;
}

/**
 * Creates a refreshed token from an existing payload
 */
export async function createRefreshedToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({
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

  return token;
}

// Export constants for middleware
export { SESSION_DURATION, SESSION_REFRESH_THRESHOLD, SESSION_COOKIE };
