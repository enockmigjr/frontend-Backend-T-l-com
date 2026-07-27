import { apiRequest } from '@/lib/api/client';
import type { CreateUser, UpdateUser } from './types';
import { actionSchema, createdUserSchema, envelope, pageEnvelope, userDetailSchema, userSchema } from './validation';

export const listUsers = async (page = 1, limit = 20, order: 'asc' | 'desc' = 'desc', signal?: AbortSignal) =>
  pageEnvelope(userSchema).parse(
    await apiRequest(`/api/v1/users?page=${page}&limit=${limit}&order=${order}`, { signal }),
  );

export const getUser = async (id: string, signal?: AbortSignal) =>
  envelope(userDetailSchema).parse(await apiRequest(`/api/v1/users/${id}?detail=full`, { signal }));

export const createUser = async (body: CreateUser) =>
  envelope(createdUserSchema).parse(await apiRequest('/api/v1/users', { method: 'POST', body }));

export const updateUser = async (id: string, body: UpdateUser) =>
  envelope(userSchema).parse(await apiRequest(`/api/v1/users/${id}`, { method: 'PATCH', body }));

export const setUserActive = async (id: string, active: boolean) =>
  actionSchema.parse(
    await apiRequest(`/api/v1/users/${id}/${active ? 'activate' : 'deactivate'}`, {
      method: 'PATCH',
    }),
  );
