import 'server-only';

import type { TokenPair } from './cookies';

type JsonObject = Readonly<Record<string, unknown>>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function objectValue(value: unknown): JsonObject | undefined {
  return isJsonObject(value) ? value : undefined;
}

export function tokenPairFromBackend(value: unknown): TokenPair | undefined {
  const envelope = objectValue(value);
  const data = objectValue(envelope?.data ?? value);
  const accessToken = data?.accessToken;
  const refreshToken = data?.refreshToken;
  const expiresIn = data?.expiresIn;
  if (typeof accessToken !== 'string' || !accessToken || typeof refreshToken !== 'string' || !refreshToken)
    return undefined;
  if (typeof expiresIn !== 'number' || !Number.isSafeInteger(expiresIn) || expiresIn <= 0) return undefined;
  return { accessToken, refreshToken, expiresIn };
}

export interface LoginUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: string;
  readonly departmentId: string;
  readonly departmentName: string | null;
  readonly mustChangePassword: boolean;
}

export function userFromLogin(value: unknown): LoginUser | undefined {
  const envelope = objectValue(value);
  const data = objectValue(envelope?.data ?? value);
  const user = objectValue(data?.user);
  if (
    !user ||
    typeof user.id !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.firstName !== 'string' ||
    typeof user.lastName !== 'string' ||
    typeof user.role !== 'string' ||
    typeof user.departmentId !== 'string' ||
    (typeof user.departmentName !== 'string' && user.departmentName !== null) ||
    typeof user.mustChangePassword !== 'boolean'
  )
    return undefined;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
    mustChangePassword: user.mustChangePassword,
  };
}
