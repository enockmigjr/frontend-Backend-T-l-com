import { NextRequest, NextResponse } from 'next/server';

import { refreshTokens } from '@/lib/api/server-client';
import { readRefreshToken, setSessionCookies } from '@/lib/auth/cookies';
import { issueCsrfToken, verifyCsrf } from '@/lib/auth/csrf';
import { csrfFailure, unauthorized } from '@/lib/auth/responses';
import { withRefreshLock } from '@/lib/auth/refresh-lock';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(request)) return csrfFailure();
  const refreshToken = readRefreshToken(request);
  if (!refreshToken) return unauthorized();
  const tokens = await withRefreshLock(refreshToken, () => refreshTokens(refreshToken));
  if (!tokens) return unauthorized();

  const response = new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  setSessionCookies(response, tokens);
  issueCsrfToken(response, tokens.refreshToken);
  return response;
}
