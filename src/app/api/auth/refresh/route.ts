import { NextRequest, NextResponse } from 'next/server';

import { refreshTokens } from '@/lib/api/server-client';
import { readRefreshToken, setSessionCookies } from '@/lib/auth/cookies';
import { issueCsrfToken, verifyCsrf } from '@/lib/auth/csrf';
import { isKeycloakAuth, refreshKeycloakTokens } from '@/lib/auth/keycloak';
import { csrfFailure, gatewayFailure, unauthorized } from '@/lib/auth/responses';
import { withRefreshLock } from '@/lib/auth/refresh-lock';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(request)) return csrfFailure();
  const refreshToken = readRefreshToken(request);
  if (!refreshToken) return unauthorized();
  try {
    const tokens = await withRefreshLock(refreshToken, () =>
      isKeycloakAuth()
        ? refreshKeycloakTokens(refreshToken).then((tokens) =>
            tokens.refresh_token
              ? { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresIn: tokens.expires_in }
              : undefined,
          )
        : refreshTokens(refreshToken),
    );
    if (!tokens) return unauthorized();
    const response = new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    setSessionCookies(response, tokens);
    issueCsrfToken(response, tokens.refreshToken);
    return response;
  } catch {
    return gatewayFailure();
  }
}
