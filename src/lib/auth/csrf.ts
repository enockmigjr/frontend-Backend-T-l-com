import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

import { authEnvironment } from './env';
import { readRefreshToken } from './cookies';

const CSRF_HEADER = 'x-csrf-token';

function csrfContext(refreshToken: string | undefined): string {
  return refreshToken ?? 'pre-authentication';
}

function signature(nonce: string, context: string): string {
  return createHmac('sha256', authEnvironment().csrfSecret)
    .update(nonce)
    .update('\0')
    .update(context)
    .digest('base64url');
}

function equal(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createCsrfToken(refreshToken?: string): string {
  const nonce = randomBytes(32).toString('base64url');
  return `${nonce}.${signature(nonce, csrfContext(refreshToken))}`;
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  const env = authEnvironment();
  response.cookies.set(env.csrfCookieName, token, {
    httpOnly: false,
    secure: env.secureCookies,
    sameSite: 'lax',
    path: '/',
    maxAge: env.refreshMaxAgeSeconds,
  });
}

export function issueCsrfToken(response: NextResponse, refreshToken?: string): string {
  const token = createCsrfToken(refreshToken);
  setCsrfCookie(response, token);
  return token;
}

function requestOrigin(request: NextRequest): string | undefined {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      return undefined;
    }
  }
  const referer = request.headers.get('referer');
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

export function hasTrustedOrigin(request: NextRequest): boolean {
  const env = authEnvironment();
  const expected = env.publicOrigin ?? request.nextUrl.origin;
  const origin = requestOrigin(request);
  const host = request.headers.get('host');
  try {
    const expectedUrl = new URL(expected);
    return origin === expectedUrl.origin && host === expectedUrl.host;
  } catch {
    return false;
  }
}

export function verifyCsrf(request: NextRequest): boolean {
  if (!hasTrustedOrigin(request)) return false;
  const env = authEnvironment();
  const cookieToken = request.cookies.get(env.csrfCookieName)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || !equal(cookieToken, headerToken)) return false;

  const separator = cookieToken.indexOf('.');
  if (separator < 1) return false;
  const nonce = cookieToken.slice(0, separator);
  const suppliedSignature = cookieToken.slice(separator + 1);
  return equal(suppliedSignature, signature(nonce, csrfContext(readRefreshToken(request))));
}
