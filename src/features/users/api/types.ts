import type { components } from '@/lib/api/schema';

export type User = components['schemas']['User'];
export type CreatedUser = components['schemas']['CreatedUser'];
export type CreateUser = components['schemas']['CreateUserDto'];
export type UpdateUser = components['schemas']['UpdateUserDto'];
export type Department = components['schemas']['Department'];
export type Category = components['schemas']['Category'];
export type SlaPolicy = components['schemas']['SlaPolicy'];
export type Setting = components['schemas']['Setting'];
export type AuditLog = components['schemas']['AuditLog'];
export type Report = components['schemas']['Report'];
export type ReportJob = components['schemas']['ReportJob'];

export interface ApiResult<T> {
  readonly success: true;
  readonly statusCode: number;
  readonly data: T;
  readonly message?: string;
}

export interface PageResult<T> extends ApiResult<readonly T[]> {
  readonly meta: { readonly page: number; readonly limit: number; readonly total: number; readonly totalPages: number };
}
