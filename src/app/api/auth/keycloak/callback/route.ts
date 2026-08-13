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
  // Échec de callback (code expiré/déjà consommé, cookies absents) : on revient
  // proprement vers la page de connexion au lieu d'afficher une erreur 400.
  const appOrigin = process.env.PUBLIC_APP_ORIGIN ?? request.nextUrl.origin;
  const failure = NextResponse.redirect(new URL('/login', appOrigin), 302);
  for (const name of ['kc_verifier', 'kc_state']) failure.cookies.set(name, '', KcClear);
  if (!code || !state || !verifier || !expectedState || state !== expectedState) return failure;

  try {
    const tokens = await exchangeCode(code, verifier);
    if (!tokens.access_token || !tokens.refresh_token) return failure;
    // PUBLIC_APP_ORIGIN est l'origine publique stable (le conteneur Next écoute
    // en interne sur 3000 alors que le navigateur utilise 3007).
    const appOrigin = process.env.PUBLIC_APP_ORIGIN ?? request.nextUrl.origin;
    const response = NextResponse.redirect(new URL('/', appOrigin), 302);
    setSessionCookies(response, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      idToken: tokens.id_token,
    });
    issueCsrfToken(response, tokens.refresh_token);
    for (const name of ['kc_verifier', 'kc_state']) response.cookies.set(name, '', KcClear);
    return response;
  } catch {
    return failure;
  }
}
