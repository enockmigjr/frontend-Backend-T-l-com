import { z } from 'zod';

const errorBodySchema = z.object({
  success: z.literal(false).optional(),
  error: z
    .object({
      code: z.string().optional(),
      message: z.string().optional(),
      correlationId: z.string().optional(),
      details: z.unknown().optional(),
    })
    .optional(),
  message: z.union([z.string(), z.array(z.string())]).optional(),
  correlationId: z.string().optional(),
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = 'API_ERROR',
    readonly correlationId?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type PageMeta = Readonly<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export type ApiPage<T> = Readonly<{ data: T; meta: PageMeta }>;

const metaSchema = z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() });

function cookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=');
}

async function csrfToken(): Promise<string> {
  const existing = cookieValue('itsm-csrf-token') ?? cookieValue('__Host-csrf-token');
  if (existing) return decodeURIComponent(existing);

  const response = await fetch('/api/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
  const parsed = z
    .object({ data: z.object({ csrfToken: z.string() }).optional(), csrfToken: z.string().optional() })
    .safeParse(await response.json().catch(() => null));
  const token = parsed.success ? (parsed.data.data?.csrfToken ?? parsed.data.csrfToken) : undefined;
  if (!response.ok || !token) throw new ApiError("Impossible d'initialiser la protection CSRF.", response.status);
  return token;
}

function mutation(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

async function errorFrom(response: Response): Promise<ApiError> {
  const body = errorBodySchema.safeParse(await response.json().catch(() => null));
  const fallbackId = response.headers.get('x-correlation-id') ?? undefined;
  if (!body.success)
    return new ApiError(`La requête a échoué (${response.status}).`, response.status, 'HTTP_ERROR', fallbackId);
  const message =
    body.data.error?.message ??
    (Array.isArray(body.data.message) ? body.data.message.join(' ') : body.data.message) ??
    `La requête a échoué (${response.status}).`;
  return new ApiError(
    message,
    response.status,
    body.data.error?.code,
    body.data.error?.correlationId ?? body.data.correlationId ?? fallbackId,
    body.data.error?.details,
  );
}

export async function apiRequest<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? 'GET';
  const headers = new Headers(init.headers);
  if (mutation(method)) headers.set('x-csrf-token', await csrfToken());
  if (init.body && !(init.body instanceof FormData)) headers.set('content-type', 'application/json');
  const response = await fetch(path, { ...init, method, headers, credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw await errorFrom(response);
  if (response.status === 204) return schema.parse(undefined);
  const envelope = z
    .object({ data: z.unknown().optional() })
    .passthrough()
    .safeParse(await response.json().catch(() => null));
  if (!envelope.success)
    throw new ApiError(
      'Réponse serveur invalide.',
      502,
      'INVALID_RESPONSE',
      response.headers.get('x-correlation-id') ?? undefined,
      envelope.error.flatten(),
    );
  const data = schema.safeParse(envelope.data.data);
  if (!data.success)
    throw new ApiError(
      'Réponse serveur invalide.',
      502,
      'INVALID_RESPONSE',
      response.headers.get('x-correlation-id') ?? undefined,
      data.error.flatten(),
    );
  return data.data;
}

export async function apiPage<T>(
  path: string,
  itemSchema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<ApiPage<readonly T[]>> {
  const response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw await errorFrom(response);
  const parsed = z
    .object({ data: z.array(itemSchema), meta: metaSchema })
    .safeParse(await response.json().catch(() => null));
  if (!parsed.success)
    throw new ApiError(
      'Réponse paginée invalide.',
      502,
      'INVALID_RESPONSE',
      response.headers.get('x-correlation-id') ?? undefined,
      parsed.error.flatten(),
    );
  return parsed.data;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}
