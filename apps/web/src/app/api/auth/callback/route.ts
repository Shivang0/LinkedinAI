import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@linkedin-ai/database';
import { exchangeCodeForTokens, getLinkedInProfile } from '@linkedin-ai/services';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { encrypt, getAppUrl } from '@/lib/utils';
import type { Session } from '@linkedin-ai/shared';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = getAppUrl();

  // Handle OAuth errors
  if (error) {
    console.error('LinkedIn OAuth error:', error);
    return NextResponse.redirect(`${appUrl}/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=no_code`);
  }

  // Verify state
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  cookieStore.delete('oauth_state');

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    // Get LinkedIn profile
    const profile = await getLinkedInProfile(tokens.accessToken);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expiresIn * 1000);

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { linkedinId: profile.id },
      create: {
        linkedinId: profile.id,
        email: profile.email,
        name: profile.name,
        profileImageUrl: profile.profileImageUrl,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        tokenExpiry,
        accountStatus: 'pending_payment',
      },
      update: {
        email: profile.email,
        name: profile.name,
        profileImageUrl: profile.profileImageUrl,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        tokenExpiry,
      },
      include: {
        subscription: true,
      },
    });

    // Build session
    const session: Session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      accountStatus: user.accountStatus,
      subscription: user.subscription
        ? {
            plan: user.subscription.plan,
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
          }
        : null,
    };

    // Create and set session token
    const sessionToken = await createSessionToken(session);
    await setSessionCookie(sessionToken);

    // Redirect based on account status
    if (user.accountStatus === 'pending_payment') {
      return NextResponse.redirect(`${appUrl}/checkout`);
    }

    if (user.accountStatus === 'suspended') {
      return NextResponse.redirect(`${appUrl}/settings/billing?suspended=true`);
    }

    if (user.accountStatus === 'canceled') {
      return NextResponse.redirect(`${appUrl}/checkout?resubscribe=true`);
    }

    // Active user - go to dashboard
    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
  }
}
