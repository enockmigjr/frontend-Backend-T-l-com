export interface ApiProblem {
  readonly code: string;
  readonly message: string;
  readonly correlationId?: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ApiProblem,
  ) {
    super(problem.message);
    this.name = 'ApiError';
  }
}

export function toApiProblem(value: unknown, fallback: string): ApiProblem {
  if (!isRecord(value)) return { code: 'UNEXPECTED_ERROR', message: fallback };
  const nested = isRecord(value.error) ? value.error : value;
  return {
    code: typeof nested.code === 'string' ? nested.code : 'UNEXPECTED_ERROR',
    message: typeof nested.message === 'string' ? nested.message : fallback,
    correlationId: typeof nested.correlationId === 'string' ? nested.correlationId : undefined,
    details: isRecord(nested.details) ? nested.details : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
