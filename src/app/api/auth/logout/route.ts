import { NextRequest, NextResponse } from 'next/server';

import { backendJson, refreshTokens, sanitizedUpstreamError } from '@/lib/api/server-client';
import { clearSessionCookies, readAccessToken, readRefreshToken } from '@/lib/auth/cookies';
import { verifyCsrf } from '@/lib/auth/csrf';
import { csrfFailure, gatewayFailure } from '@/lib/auth/responses';
import { withRefreshLock } from '@/lib/auth/refresh-lock';

function cleared(response: NextResponse): NextResponse {
  clearSessionCookies(response);
  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(request)) return csrfFailure();
  let accessToken = readAccessToken(request);
  const refreshToken = readRefreshToken(request);
  if (!refreshToken) return cleared(new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }));

  try {
    let tokenToRevoke = refreshToken;
    let upstream: Response | undefined;
    if (accessToken)
      upstream = await backendJson('/api/v1/auth/logout', 'POST', { refreshToken: tokenToRevoke }, accessToken);
    if (!upstream || upstream.status === 401) {
      const rotated = await withRefreshLock(refreshToken, () => refreshTokens(refreshToken));
      if (!rotated) return cleared(new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }));
      accessToken = rotated.accessToken;
      tokenToRevoke = rotated.refreshToken;
      upstream = await backendJson('/api/v1/auth/logout', 'POST', { refreshToken: tokenToRevoke }, accessToken);
    }
    const response = upstream.ok
      ? new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
      : sanitizedUpstreamError(upstream.status);
    return cleared(response);
  } catch {
    return cleared(gatewayFailure());
  }
}
