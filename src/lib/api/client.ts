import { ApiError, toApiProblem } from './errors';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  readonly method?: ApiMethod;
  readonly body?: BodyInit | Readonly<Record<string, unknown>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
  readonly idempotencyKey?: string;
}

let csrfToken: string | null = null;

export function resetCsrfToken(): void {
  csrfToken = null;
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<unknown> {
  const method = options.method ?? 'GET';
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;
  if (isMutation(method)) {
    headers.set('x-csrf-token', await getCsrfToken());
  }
  if (options.idempotencyKey) headers.set('idempotency-key', options.idempotencyKey);
  if (!options.body) {
    body = undefined;
  } else if (options.body instanceof FormData || options.body instanceof Blob || typeof options.body === 'string') {
    body = options.body;
  } else {
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    body = JSON.stringify(options.body);
  }
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
    if (response.status === 403 && toApiProblem(payload, 'Accès refusé').code === 'CSRF_INVALID') resetCsrfToken();
    throw new ApiError(response.status, toApiProblem(payload, `La requête a échoué (${response.status}).`));
  }
  if (response.status === 204) return undefined;
  const payload: unknown = await response.json();
  return payload;
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const response = await fetch('/api/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
  const payload: unknown = await response.json();
  if (!response.ok || !isCsrfPayload(payload)) throw new Error('Impossible d’initialiser la protection CSRF.');
  csrfToken = payload.data.csrfToken;
  return csrfToken;
}

function isMutation(method: ApiMethod): boolean {
  return method !== 'GET';
}
function isCsrfPayload(value: unknown): value is { data: { csrfToken: string } } {
  if (typeof value !== 'object' || value === null || !('data' in value)) return false;
  const data = value.data;
  return typeof data === 'object' && data !== null && 'csrfToken' in data && typeof data.csrfToken === 'string';
}
