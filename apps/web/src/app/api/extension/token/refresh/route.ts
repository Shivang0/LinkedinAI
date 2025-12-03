import { NextResponse } from 'next/server';
import { refreshExtensionToken, extractBearerToken } from '@/lib/extension-auth';

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/extension/token/refresh - Refresh extension token
export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401, headers: corsHeaders }
      );
    }

    const result = await refreshExtensionToken(token);

    if (!result) {
      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 401, headers: corsHeaders }
      );
    }

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('Extension token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500, headers: corsHeaders }
    );
  }
}
