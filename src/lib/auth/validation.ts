import 'server-only';

import { z } from 'zod';

const MAX_AUTH_BODY_BYTES = 16 * 1024;

export const loginSchema = z
  .object({
    email: z.string().trim().email().min(5).max(254),
    password: z.string().min(8).max(256),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(256),
    newPassword: z.string().min(8).max(256),
  })
  .strict();

export async function parseSmallJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.toLowerCase();
  if (!contentType?.startsWith('application/json')) throw new Error('INVALID_CONTENT_TYPE');
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AUTH_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_AUTH_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  return JSON.parse(text);
}
