import { NextRequest, NextResponse } from 'next/server';

import { setSessionCookies } from '@/lib/auth/cookies';
import { issueCsrfToken } from '@/lib/auth/csrf';
import { exchangeCode, isKeycloakAuth } from '@/lib/auth/keycloak';

const KcClear = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', expires: new Date(0), maxAge: 0 };

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isKeycloakAuth()) return new NextResponse(null, { status: 404 });
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const verifier = request.cookies.get('kc_verifier')?.value;
  const expectedState = request.cookies.get('kc_state')?.value;
  const failure = new NextResponse(null, { status: 400 });
  for (const name of ['kc_verifier', 'kc_state']) failure.cookies.set(name, '', KcClear);
  if (!code || !state || !verifier || !expectedState || state !== expectedState) return failure;

  try {
    const tokens = await exchangeCode(code, verifier);
    if (!tokens.access_token || !tokens.refresh_token) return failure;
    const response = NextResponse.redirect(new URL('/', request.nextUrl.origin), 302);
    setSessionCookies(response, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
    issueCsrfToken(response, tokens.refresh_token);
    for (const name of ['kc_verifier', 'kc_state']) response.cookies.set(name, '', KcClear);
    return response;
  } catch {
    return failure;
  }
}
