import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

interface TokenResponse {
  readonly access_token: string;
  readonly refresh_token?: string;
  readonly expires_in: number;
  readonly id_token?: string;
}

export function isKeycloakAuth(): boolean {
  return process.env.AUTH_PROVIDER === 'keycloak';
}

export function keycloakEndpoints() {
  const issuer = process.env.KEYCLOAK_ISSUER;
  if (!issuer) throw new Error('KEYCLOAK_ISSUER is required for SSO');
  const origin = process.env.PUBLIC_APP_ORIGIN ?? 'http://localhost:3007';
  // Le navigateur doit joindre l'URL publique (KEYCLOAK_ISSUER), mais les appels
  // serveur (échange du code, refresh) doivent joindre Keycloak par le nom de
  // service Docker (KEYCLOAK_INTERNAL_ISSUER) — sinon le conteneur s'appelle lui-même.
  const internalIssuer = process.env.KEYCLOAK_INTERNAL_ISSUER ?? issuer;
  return {
    issuer,
    internalIssuer,
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'telecom-frontend',
    redirectUri: process.env.KEYCLOAK_REDIRECT_URI ?? `${origin}/api/auth/keycloak/callback`,
    authorizeUrl: `${issuer}/protocol/openid-connect/auth`,
    tokenUrl: `${internalIssuer}/protocol/openid-connect/token`,
    endSessionUrl: `${issuer}/protocol/openid-connect/logout`,
  } as const;
}

export function generatePkce() {
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function buildAuthorizeUrl(state: string, challenge: string): string {
  const endpoints = keycloakEndpoints();
  const url = new URL(endpoints.authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', endpoints.clientId);
  url.searchParams.set('redirect_uri', endpoints.redirectUri);
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCode(code: string, verifier: string): Promise<TokenResponse> {
  const endpoints = keycloakEndpoints();
  const response = await fetch(endpoints.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: endpoints.clientId,
      code,
      redirect_uri: endpoints.redirectUri,
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Échange de code Keycloak refusé (${response.status}).`);
  return (await response.json()) as TokenResponse;
}

export async function refreshKeycloakTokens(refreshToken: string): Promise<TokenResponse | undefined> {
  const endpoints = keycloakEndpoints();
  const response = await fetch(endpoints.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: endpoints.clientId,
      refresh_token: refreshToken,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 401) return undefined;
  if (!response.ok) throw new Error(`Refresh Keycloak refusé (${response.status}).`);
  return (await response.json()) as TokenResponse;
}

export function endSessionUrl(idTokenHint?: string): string {
  const endpoints = keycloakEndpoints();
  const origin = process.env.PUBLIC_APP_ORIGIN ?? 'http://localhost:3007';
  const url = new URL(endpoints.endSessionUrl);
  url.searchParams.set('client_id', endpoints.clientId);
  // Après le logout Keycloak, revenir sur la page de connexion (pas sur une route API).
  url.searchParams.set('post_logout_redirect_uri', `${origin}/login`);
  if (idTokenHint) url.searchParams.set('id_token_hint', idTokenHint);
  return url.toString();
}

/** Console de compte Keycloak (mot de passe, sessions, appareils). */
export function keycloakAccountUrl(): string {
  return `${keycloakEndpoints().issuer}/account/`;
}
