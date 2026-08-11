import { apiRequest } from '@/lib/api/client';
import { envelope, pageEnvelope } from '@/features/users/api/validation';
import { requesterDetailSchema, requesterSchema, type RequesterFilters } from './types';

export const listRequesters = async (filters: RequesterFilters, page = 1, limit = 20, signal?: AbortSignal) => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.supportIntegrationId) query.set('supportIntegrationId', filters.supportIntegrationId);
  if (filters.search?.trim()) query.set('search', filters.search.trim());
  if (filters.anonymized) query.set('anonymized', filters.anonymized);
  return pageEnvelope(requesterSchema).parse(await apiRequest(`/api/v1/external-requesters?${query}`, { signal }));
};

export const getRequester = async (id: string, signal?: AbortSignal) =>
  envelope(requesterDetailSchema).parse(await apiRequest(`/api/v1/external-requesters/${id}`, { signal }));
