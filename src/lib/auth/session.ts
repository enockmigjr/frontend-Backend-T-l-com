import { apiRequest } from '@/lib/api/client';
import { z } from 'zod';

export const USER_ROLES = [
  'ADMINISTRATOR',
  'SUPERVISOR',
  'CUSTOMER_SERVICE_AGENT',
  'NOC_ENGINEER',
  'BILLING_AGENT',
  'TECHNICAL_SUPPORT_ENGINEER',
  'FIELD_TECHNICIAN',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface CurrentUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly departmentId?: string | null;
  readonly mustChangePassword?: boolean;
}

const currentUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(USER_ROLES),
  departmentId: z.string().uuid().nullable().optional(),
  mustChangePassword: z.boolean().optional(),
});
const currentUserEnvelopeSchema = z.object({ data: currentUserSchema });

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const response = currentUserEnvelopeSchema.parse(await apiRequest('/api/v1/users/me', { signal }));
  return response.data;
}
