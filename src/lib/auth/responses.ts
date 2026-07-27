import 'server-only';

import { NextResponse } from 'next/server';

export function noStoreJson(body: object, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function csrfFailure(): NextResponse {
  return noStoreJson({ success: false, error: { code: 'CSRF_INVALID', message: 'Requête non autorisée.' } }, 403);
}

export function gatewayFailure(): NextResponse {
  return noStoreJson(
    { success: false, error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Service temporairement indisponible.' } },
    502,
  );
}

export function unauthorized(): NextResponse {
  return noStoreJson({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentification requise.' } }, 401);
}
