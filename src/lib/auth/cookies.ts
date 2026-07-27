import 'server-only';

import type { NextRequest, NextResponse } from 'next/server';

import { authEnvironment } from './env';

export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}

export function readAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get(authEnvironment().accessCookieName)?.value;
}

export function readRefreshToken(request: NextRequest): string | undefined {
  return request.cookies.get(authEnvironment().refreshCookieName)?.value;
}

export function setSessionCookies(response: NextResponse, tokens: TokenPair): void {
  const env = authEnvironment();
  const shared = { secure: env.secureCookies, sameSite: 'lax' as const, path: '/' };
  response.cookies.set(env.accessCookieName, tokens.accessToken, {
    ...shared,
    httpOnly: true,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(env.refreshCookieName, tokens.refreshToken, {
    ...shared,
    httpOnly: true,
    maxAge: env.refreshMaxAgeSeconds,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  const env = authEnvironment();
  for (const name of [env.accessCookieName, env.refreshCookieName, env.csrfCookieName]) {
    response.cookies.set(name, '', {
      httpOnly: name !== env.csrfCookieName,
      secure: env.secureCookies,
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
      maxAge: 0,
    });
  }
}
