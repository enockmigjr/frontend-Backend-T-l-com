import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

import { clearSessionCookies, readAccessToken, readIdTokenCookie } from '@/lib/auth/cookies';
import { authEnvironment } from '@/lib/auth/env';
import { endSessionUrl, revokeAllUserSessions } from '@/lib/auth/keycloak';

function subjectFromAccessToken(token: string): string | undefined {
  try {
    const payload = token.split('.')[1];
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: unknown };
    return typeof data.sub === 'string' ? data.sub : undefined;
  } catch {
    return undefined;
  }
}

interface TokenPayload {
  readonly sub?: unknown;
  readonly exp?: unknown;
}

function payloadFromAccessToken(token: string): TokenPayload | undefined {
  try {
    const data = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as TokenPayload;
    return data;
  } catch {
    return undefined;
  }
}

/**
 * Invalide les jetons d'accès déjà émis côté API (les sessions Keycloak sont
 * déjà révoquées par l'API admin). TTL = durée restante du jeton + 5 min.
 */
async function blacklistUserTokens(subject: string, accessToken: string): Promise<void> {
  const redisUrl = authEnvironment().redisUrl;
  if (!redisUrl) return;
  const payload = payloadFromAccessToken(accessToken);
  const exp = typeof payload?.exp === 'number' ? payload.exp * 1000 : Date.now() + 15 * 60 * 1000;
  const ttlSeconds = Math.max(Math.ceil((exp - Date.now()) / 1000), 60) + 300;
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
  try {
    await redis.set(`jwt_user_bl:${subject}`, String(Date.now()), 'EX', ttlSeconds);
  } catch (error) {
    console.error(
      '[keycloak] blacklist jwt_user_bl impossible (les sessions Keycloak restent révoquées)',
      error instanceof Error ? error.message : error,
    );
  } finally {
    redis.disconnect();
  }
}

/**
 * Déconnexion de toutes les sessions : révoque d'abord toutes les sessions de
 * l'utilisateur via l'API admin Keycloak, puis termine la session SSO du
 * navigateur courant (comme le logout simple) et revient sur /login.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const accessToken = readAccessToken(request);
  const subject = accessToken ? subjectFromAccessToken(accessToken) : undefined;
  let revoked = false;
  if (subject) {
    try {
      await revokeAllUserSessions(subject);
      await blacklistUserTokens(subject, accessToken ?? '');
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
