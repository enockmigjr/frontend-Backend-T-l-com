import { NextRequest, NextResponse } from 'next/server';

import { readRefreshToken, setSessionCookies } from '@/lib/auth/cookies';
import { issueCsrfToken, verifyCsrf } from '@/lib/auth/csrf';
import { refreshKeycloakTokens } from '@/lib/auth/keycloak';
import { csrfFailure, gatewayFailure, unauthorized } from '@/lib/auth/responses';
import { withRefreshLock } from '@/lib/auth/refresh-lock';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(request)) return csrfFailure();
  const refreshToken = readRefreshToken(request);
  if (!refreshToken) return unauthorized();
  try {
    const tokens = await withRefreshLock(refreshToken, async () => {
      const refreshed = await refreshKeycloakTokens(refreshToken);
      return refreshed?.refresh_token
        ? {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            expiresIn: refreshed.expires_in,
          }
        : undefined;
    });
    if (!tokens) return unauthorized();
    const response = new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    setSessionCookies(response, tokens);
    issueCsrfToken(response, tokens.refreshToken);
    return response;
  } catch {
    return gatewayFailure();
  }
}
