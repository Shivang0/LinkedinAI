import { NextResponse } from 'next/server';
import { verifyExtensionToken, extractBearerToken } from '@/lib/extension-auth';

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/extension/auth - Verify extension token
export async function GET(request: Request) {
  try {
    const token = extractBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { headers: corsHeaders }
      );
    }

    const payload = await verifyExtensionToken(token);

    if (!payload) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          accountStatus: payload.accountStatus,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Extension auth verification error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { headers: corsHeaders }
    );
  }
}
