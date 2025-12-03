import { randomBytes, createHash } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@linkedin-ai/database';

// Extension token configuration
const EXTENSION_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'development-secret-change-me'
);
const TOKEN_EXPIRY_HOURS = 24;

export interface ExtensionTokenPayload {
  userId: string;
  email: string;
  name: string;
  accountStatus: string;
  type: 'extension';
  exp: number;
  iat: number;
}

/**
 * Generate a random token
 */
function generateRandomToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Create an extension token for a user
 */
export async function createExtensionToken(user: {
  userId: string;
  email: string;
  name: string;
  accountStatus: string;
}): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

  // Create JWT token
  const token = await new SignJWT({
    userId: user.userId,
    email: user.email,
    name: user.name,
    accountStatus: user.accountStatus,
    type: 'extension',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_HOURS}h`)
    .sign(EXTENSION_JWT_SECRET);

  // Store token hash in database
  const tokenHash = hashToken(token);
  await prisma.extensionToken.create({
    data: {
      userId: user.userId,
      tokenHash,
      expiresAt: new Date(expiresAt),
    },
  });

  return { token, expiresAt };
}

/**
 * Verify an extension token
 */
export async function verifyExtensionToken(token: string): Promise<ExtensionTokenPayload | null> {
  try {
    // Verify JWT signature and expiration
    const { payload } = await jwtVerify(token, EXTENSION_JWT_SECRET);
    const typedPayload = payload as unknown as ExtensionTokenPayload;

    // Check if it's an extension token
    if (typedPayload.type !== 'extension') {
      return null;
    }

    // Check if token exists in database and is not revoked
    const tokenHash = hashToken(token);
    const storedToken = await prisma.extensionToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revokedAt) {
      return null;
    }

    // Check if token is expired in database
    if (storedToken.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp
    await prisma.extensionToken.update({
      where: { id: storedToken.id },
      data: { lastUsedAt: new Date() },
    });

    return typedPayload;
  } catch {
    return null;
  }
}

/**
 * Refresh an extension token
 */
export async function refreshExtensionToken(oldToken: string): Promise<{ token: string; expiresAt: number } | null> {
  const payload = await verifyExtensionToken(oldToken);
  if (!payload) {
    return null;
  }

  // Get fresh user data
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.accountStatus !== 'active') {
    return null;
  }

  // Revoke old token
  const oldTokenHash = hashToken(oldToken);
  await prisma.extensionToken.update({
    where: { tokenHash: oldTokenHash },
    data: { revokedAt: new Date() },
  });

  // Create new token
  return createExtensionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    accountStatus: user.accountStatus,
  });
}

/**
 * Revoke an extension token
 */
export async function revokeExtensionToken(token: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(token);
    await prisma.extensionToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke all extension tokens for a user
 */
export async function revokeAllUserExtensionTokens(userId: string): Promise<void> {
  await prisma.extensionToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

/**
 * Clean up expired tokens (for use in a cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.extensionToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
