import { apiRequest } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { actionSchema, departmentSchema, envelope } from '@/features/users/api/validation';
type Create = components['schemas']['CreateDepartmentDto'];
export const listDepartments = async (signal?: AbortSignal) =>
  envelope(departmentSchema.array()).parse(await apiRequest('/api/v1/departments', { signal }));
export const createDepartment = async (body: Create) =>
  envelope(departmentSchema).parse(await apiRequest('/api/v1/departments', { method: 'POST', body }));
export const updateDepartment = async (id: string, body: Partial<Create>) =>
  envelope(departmentSchema).parse(await apiRequest(`/api/v1/departments/${id}`, { method: 'PATCH', body }));
export const deleteDepartment = async (id: string) =>
  actionSchema.parse(await apiRequest(`/api/v1/departments/${id}`, { method: 'DELETE' }));
