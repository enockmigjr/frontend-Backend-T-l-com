export interface ApiEnvelope<T> {
  readonly success: true;
  readonly statusCode: number;
  readonly data: T;
  readonly message?: string;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PaginatedEnvelope<T> extends ApiEnvelope<readonly T[]> {
  readonly meta: PaginationMeta;
}
