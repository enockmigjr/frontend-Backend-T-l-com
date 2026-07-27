import 'server-only';

import { backendInternalUrl } from '@/lib/auth/env';
import { gatewayFailure, noStoreJson } from '@/lib/auth/responses';
import { tokenPairFromBackend } from '@/lib/auth/token-pair';
import type { TokenPair } from '@/lib/auth/cookies';

const SAFE_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  400: 'Requête invalide.',
  401: 'Identifiants ou session invalides.',
  403: 'Accès refusé.',
  409: 'Conflit avec l’état actuel.',
  429: 'Trop de tentatives. Réessayez plus tard.',
};

export function backendUrl(pathname: string, search = ''): URL {
  if (!pathname.startsWith('/api/v1/') || pathname.includes('\\')) throw new Error('Invalid backend path');
  const base = backendInternalUrl();
  const url = new URL(pathname, `${base.origin}/`);
  url.search = search;
  return url;
}

export async function backendJson(
  pathname: string,
  method: 'GET' | 'POST' | 'PUT',
  body?: Readonly<Record<string, string>>,
  accessToken?: string,
): Promise<Response> {
  const headers = new Headers({ accept: 'application/json' });
  if (body) headers.set('content-type', 'application/json');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  return fetch(backendUrl(pathname), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
}

export async function parseBackendJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')?.toLowerCase();
  if (!contentType?.includes('application/json')) return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export function sanitizedUpstreamError(status: number) {
  const safeStatus = status >= 400 && status < 500 ? status : 502;
  if (safeStatus === 502) return gatewayFailure();
  return noStoreJson(
    {
      success: false,
      error: { code: `AUTH_${safeStatus}`, message: SAFE_ERROR_MESSAGES[safeStatus] ?? 'Requête refusée.' },
    },
    safeStatus,
  );
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair | undefined> {
  const response = await backendJson('/api/v1/auth/refresh', 'POST', { refreshToken });
  if (response.status === 401) return undefined;
  if (!response.ok) throw new Error(`Refresh backend indisponible (${response.status})`);
  const tokens = tokenPairFromBackend(await parseBackendJson(response));
  if (!tokens) throw new Error('Réponse de refresh invalide');
  return tokens;
}
