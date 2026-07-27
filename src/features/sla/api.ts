import { apiRequest } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { envelope, slaPolicySchema } from '@/features/users/api/validation';
type Create = components['schemas']['CreateSlaPolicyDto'];
type Update = components['schemas']['UpdateSlaPolicyDto'];
export const listPolicies = async (signal?: AbortSignal) =>
  envelope(slaPolicySchema.array()).parse(await apiRequest('/api/v1/sla-policies', { signal }));
export const createPolicy = async (body: Create) =>
  envelope(slaPolicySchema).parse(await apiRequest('/api/v1/sla-policies', { method: 'POST', body }));
export const updatePolicy = async (id: string, body: Update) =>
  envelope(slaPolicySchema).parse(await apiRequest(`/api/v1/sla-policies/${id}`, { method: 'PATCH', body }));
