/**
 * ============================================================================
 * FICHIER : frontend/src/lib/api/client.ts
 * RÔLE : Client HTTP centralisé du Frontend React / Next.js (`apiRequest`).
 * EXPLICATION (Pour non-développeurs) :
 * Toutes les requêtes envoyées par le navigateur vers l'API backend passent par ce fichier.
 * Il gère automatiquement :
 * 1. L'injection des jetons de protection contre le piratage CSRF (`x-csrf-token`).
 * 2. La conversion automatique du corps de la requête en JSON.
 * 3. L'envoi optionnel des clés d'idempotence (`idempotency-key`) pour éviter les doublons.
 * 4. La gestion propre des erreurs et le renouvellement automatique si un jeton CSRF a expiré.
 * ============================================================================
 */

import { ApiError, toApiProblem } from './errors';

/** Types des méthodes HTTP autorisées */
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Options de requête HTTP */
export interface ApiRequestOptions {
  readonly method?: ApiMethod;
  readonly body?: BodyInit | Readonly<Record<string, unknown>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
  readonly idempotencyKey?: string;
}

/** Jeton CSRF conservé en mémoire pour sécuriser les mutations (POST, PUT, DELETE) */
let csrfToken: string | null = null;

/**
 * Réinitialise le jeton CSRF en mémoire.
 */
export function resetCsrfToken(): void {
  csrfToken = null;
}

/**
 * Fonction universelle `apiRequest()` pour appeler l'API backend depuis le frontend.
 */
export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<unknown> {
  const method = options.method ?? 'GET';
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;
  if (options.idempotencyKey) headers.set('idempotency-key', options.idempotencyKey);
  if (!options.body) {
    body = undefined;
  } else if (options.body instanceof FormData || options.body instanceof Blob || typeof options.body === 'string') {
    body = options.body;
  } else {
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    body = JSON.stringify(options.body);
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (isMutation(method)) headers.set('x-csrf-token', await getCsrfToken());
    const response = await fetch(path, {
      method,
      body,
      headers,
      signal: options.signal,
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const rotatedCsrfToken = response.headers.get('x-csrf-token');
    if (rotatedCsrfToken) csrfToken = rotatedCsrfToken;
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      const problem = toApiProblem(payload, `La requête a échoué (${response.status}).`);
      if (response.status === 403 && problem.code === 'CSRF_INVALID' && attempt === 0) {
        resetCsrfToken();
        continue;
      }
      throw new ApiError(response.status, problem);
    }
    if (response.status === 204) return undefined;
    return response.json();
  }
  throw new ApiError(403, { code: 'CSRF_INVALID', message: 'Protection CSRF invalide.' });
}

/**
 * Récupère le jeton CSRF auprès de l'API s'il n'est pas déjà présent en mémoire.
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const response = await fetch('/api/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
  const payload: unknown = await response.json();
  if (!response.ok || !isCsrfPayload(payload)) throw new Error('Impossible d’initialiser la protection CSRF.');
  csrfToken = payload.data.csrfToken;
  return csrfToken;
}

/**
 * Indique si la méthode HTTP modifie des données (mutation).
 */
function isMutation(method: ApiMethod): boolean {
  return method !== 'GET';
}

/**
 * Vérifie si la réponse reçue contient un jeton CSRF valide.
 */
function isCsrfPayload(value: unknown): value is { data: { csrfToken: string } } {
  if (typeof value !== 'object' || value === null || !('data' in value)) return false;
  const data = value.data;
  return typeof data === 'object' && data !== null && 'csrfToken' in data && typeof data.csrfToken === 'string';
}

