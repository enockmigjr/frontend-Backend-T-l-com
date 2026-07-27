import { NextRequest, NextResponse } from 'next/server';

import { readRefreshToken } from '@/lib/auth/cookies';
import { createCsrfToken, setCsrfCookie } from '@/lib/auth/csrf';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest): NextResponse {
  const csrfToken = createCsrfToken(readRefreshToken(request));
  const response = NextResponse.json(
    { success: true, statusCode: 200, data: { csrfToken } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
  setCsrfCookie(response, csrfToken);
  return response;
}
