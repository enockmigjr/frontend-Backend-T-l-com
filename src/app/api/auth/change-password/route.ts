import { NextRequest, NextResponse } from 'next/server';

import { backendJson, refreshTokens, sanitizedUpstreamError } from '@/lib/api/server-client';
import { clearSessionCookies, readRefreshToken, setSessionCookies } from '@/lib/auth/cookies';
import type { TokenPair } from '@/lib/auth/cookies';
import { issueCsrfToken, verifyCsrf } from '@/lib/auth/csrf';
import { changePasswordSchema, parseSmallJson } from '@/lib/auth/validation';
import { csrfFailure, gatewayFailure, noStoreJson, unauthorized } from '@/lib/auth/responses';
import { withRefreshLock } from '@/lib/auth/refresh-lock';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(request)) return csrfFailure();
  const refreshToken = readRefreshToken(request);
  if (!refreshToken) return unauthorized();
  let rotatedTokens: TokenPair | undefined;
  try {
    const parsed = changePasswordSchema.safeParse(await parseSmallJson(request));
    if (!parsed.success)
      return noStoreJson(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Mot de passe invalide.' } },
        400,
      );
    rotatedTokens = await withRefreshLock(refreshToken, () => refreshTokens(refreshToken));
    if (!rotatedTokens) {
      const response = unauthorized();
      clearSessionCookies(response);
      return response;
    }
    const upstream = await backendJson('/api/v1/auth/change-password', 'PUT', parsed.data, rotatedTokens.accessToken);
    const response = upstream.ok
      ? new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
      : sanitizedUpstreamError(upstream.status);
    setSessionCookies(response, rotatedTokens);
    issueCsrfToken(response, rotatedTokens.refreshToken);
    return response;
  } catch {
    const response = gatewayFailure();
    if (rotatedTokens) {
      setSessionCookies(response, rotatedTokens);
      issueCsrfToken(response, rotatedTokens.refreshToken);
    }
    return response;
  }
}
