import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createExtensionToken } from '@/lib/extension-auth';

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/extension/token - Exchange web session for extension token
export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (session.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Create extension token
    const { token, expiresAt } = await createExtensionToken({
      userId: session.userId,
      email: session.email,
      name: session.name,
      accountStatus: session.accountStatus,
    });

    return NextResponse.json({ token, expiresAt }, { headers: corsHeaders });
  } catch (error) {
    console.error('Extension token creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create extension token' },
      { status: 500, headers: corsHeaders }
    );
  }
}
