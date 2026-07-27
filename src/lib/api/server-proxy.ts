import 'server-only';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { backendUrl, refreshTokens } from './server-client';
import { readAccessToken, readRefreshToken, setSessionCookies } from '@/lib/auth/cookies';
import { issueCsrfToken, verifyCsrf } from '@/lib/auth/csrf';
import { csrfFailure, gatewayFailure, noStoreJson, unauthorized } from '@/lib/auth/responses';
import { withRefreshLock } from '@/lib/auth/refresh-lock';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const BLOCKED_AUTH_ROUTES = new Set(['login', 'refresh', 'logout', 'logout-all', 'change-password']);
const REQUEST_HEADER_DENYLIST = new Set([
  'authorization',
  'cookie',
  'connection',
  'host',
  'origin',
  'referer',
  'content-length',
  'transfer-encoding',
  'upgrade',
  'proxy-authorization',
  'proxy-authenticate',
  'keep-alive',
  'te',
  'trailer',
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
  'x-real-ip',
  'x-csrf-token',
]);
const RESPONSE_HEADER_ALLOWLIST = new Set([
  'content-type',
  'content-disposition',
  'content-language',
  'etag',
  'last-modified',
  'accept-ranges',
  'content-range',
  'x-correlation-id',
  'retry-after',
]);

function validSegments(segments: readonly string[]): boolean {
  return (
    segments.length > 0 &&
    segments.every(
      (segment) =>
        segment.length > 0 &&
        segment !== '.' &&
        segment !== '..' &&
        !segment.includes('/') &&
        !segment.includes('\\') &&
        !segment.includes('\0'),
    )
  );
}

function isBlockedAuthRoute(segments: readonly string[]): boolean {
  return segments[0] === 'auth' && segments[1] !== undefined && BLOCKED_AUTH_ROUTES.has(segments[1]);
}

function requestHeaders(request: NextRequest, accessToken: string): Headers {
  const headers = new Headers();
  for (const [name, value] of request.headers) {
    if (!REQUEST_HEADER_DENYLIST.has(name.toLowerCase()) && !name.toLowerCase().startsWith('sec-'))
      headers.set(name, value);
  }
  headers.set('authorization', `Bearer ${accessToken}`);
  return headers;
}

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  for (const [name, value] of upstream.headers) {
    if (RESPONSE_HEADER_ALLOWLIST.has(name.toLowerCase())) headers.set(name, value);
  }
  return headers;
}

async function sendUpstream(request: NextRequest, segments: readonly string[], accessToken: string): Promise<Response> {
  const pathname = `/api/v1/${segments.map(encodeURIComponent).join('/')}`;
  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers: requestHeaders(request, accessToken),
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  };
  if (!SAFE_METHODS.has(request.method)) {
    init.body = request.body;
    init.duplex = 'half';
  }
  return fetch(new Request(backendUrl(pathname, request.nextUrl.search), init));
}

function fromUpstream(upstream: Response): NextResponse {
  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders(upstream) });
}

export async function proxyToBackend(request: NextRequest, segments: readonly string[]): Promise<NextResponse> {
  if (!validSegments(segments) || isBlockedAuthRoute(segments)) {
    return noStoreJson({ success: false, error: { code: 'ROUTE_NOT_FOUND', message: 'Route introuvable.' } }, 404);
  }
  if (!SAFE_METHODS.has(request.method) && !verifyCsrf(request)) return csrfFailure();

  const accessToken = readAccessToken(request);
  if (!accessToken) return unauthorized();
  try {
    let upstream = await sendUpstream(request, segments, accessToken);
    if (upstream.status !== 401 || !SAFE_METHODS.has(request.method)) return fromUpstream(upstream);

    const refreshToken = readRefreshToken(request);
    if (!refreshToken) return fromUpstream(upstream);
    await upstream.body?.cancel();
    const tokens = await withRefreshLock(refreshToken, () => refreshTokens(refreshToken));
    if (!tokens) return unauthorized();
    upstream = await sendUpstream(request, segments, tokens.accessToken);
    const response = fromUpstream(upstream);
    setSessionCookies(response, tokens);
    const csrfToken = issueCsrfToken(response, tokens.refreshToken);
    response.headers.set('x-csrf-token', csrfToken);
    return response;
  } catch {
    return gatewayFailure();
  }
}
