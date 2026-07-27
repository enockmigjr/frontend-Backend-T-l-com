import { NextRequest, NextResponse } from 'next/server';

import { backendJson, parseBackendJson, sanitizedUpstreamError } from '@/lib/api/server-client';
import { setSessionCookies } from '@/lib/auth/cookies';
import { issueCsrfToken, verifyCsrf } from '@/lib/auth/csrf';
import { csrfFailure, gatewayFailure, noStoreJson } from '@/lib/auth/responses';
import { tokenPairFromBackend, userFromLogin } from '@/lib/auth/token-pair';
import { loginSchema, parseSmallJson } from '@/lib/auth/validation';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCsrf(request)) return csrfFailure();
  try {
    const parsed = loginSchema.safeParse(await parseSmallJson(request));
    if (!parsed.success)
      return noStoreJson(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Identifiants invalides.' } },
        400,
      );

    const upstream = await backendJson('/api/v1/auth/login', 'POST', parsed.data);
    if (!upstream.ok) return sanitizedUpstreamError(upstream.status);
    const payload = await parseBackendJson(upstream);
    const tokens = tokenPairFromBackend(payload);
    const user = userFromLogin(payload);
    if (!tokens || !user) return gatewayFailure();

    const response = NextResponse.json(
      { success: true, statusCode: 200, data: { user } },
      { headers: { 'Cache-Control': 'no-store' } },
    );
    setSessionCookies(response, tokens);
    issueCsrfToken(response, tokens.refreshToken);
    return response;
  } catch {
    return gatewayFailure();
  }
}
