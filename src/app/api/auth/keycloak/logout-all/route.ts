import { NextRequest, NextResponse } from 'next/server';

import { clearSessionCookies, readAccessToken, readIdTokenCookie } from '@/lib/auth/cookies';
import { endSessionUrl, isKeycloakAuth, revokeAllUserSessions } from '@/lib/auth/keycloak';

function subjectFromAccessToken(token: string): string | undefined {
  try {
    const payload = token.split('.')[1];
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: unknown };
    return typeof data.sub === 'string' ? data.sub : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Déconnexion de toutes les sessions : révoque d'abord toutes les sessions de
 * l'utilisateur via l'API admin Keycloak, puis termine la session SSO du
 * navigateur courant (comme le logout simple) et revient sur /login.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isKeycloakAuth()) return new NextResponse(null, { status: 404 });

  const accessToken = readAccessToken(request);
  const subject = accessToken ? subjectFromAccessToken(accessToken) : undefined;
  let revoked = false;
  if (subject) {
    try {
      await revokeAllUserSessions(subject);
      revoked = true;
    } catch (error) {
      console.error('[keycloak] révocation de toutes les sessions impossible', error instanceof Error ? error.message : error);
      // Repli : on termine au moins la session du navigateur courant.
      revoked = false;
    }
  }

  const response = NextResponse.redirect(endSessionUrl(readIdTokenCookie(request)), 302);
  clearSessionCookies(response);
  if (!revoked) response.headers.set('x-logout-all-degraded', 'true');
  return response;
}
