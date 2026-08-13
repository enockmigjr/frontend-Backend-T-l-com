import { type NextRequest, NextResponse } from 'next/server';

import { clearSessionCookies, readIdTokenCookie } from '@/lib/auth/cookies';
import { endSessionUrl, isKeycloakAuth } from '@/lib/auth/keycloak';

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isKeycloakAuth()) return new NextResponse(null, { status: 404 });
  // id_token_hint garantit la fin réelle de la session Keycloak (SSO) et que
  // Keycloak honore post_logout_redirect_uri → /login.
  const response = NextResponse.redirect(endSessionUrl(readIdTokenCookie(request)), 302);
  clearSessionCookies(response);
  return response;
}
