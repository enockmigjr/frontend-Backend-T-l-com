import { apiRequest } from '@/lib/api/client';
import { envelope, pageEnvelope } from '@/features/users/api/validation';
import { deliverySchema, type DeliveryFilters } from './types';

export const listDeliveries = async (filters: DeliveryFilters, page = 1, limit = 20, signal?: AbortSignal) => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.supportIntegrationId) query.set('supportIntegrationId', filters.supportIntegrationId);
  if (filters.channel) query.set('channel', filters.channel);
  if (filters.status) query.set('status', filters.status);
  return pageEnvelope(deliverySchema).parse(await apiRequest(`/api/v1/external-deliveries?${query}`, { signal }));
};

export const getDelivery = async (id: string, signal?: AbortSignal) =>
  envelope(deliverySchema).parse(await apiRequest(`/api/v1/external-deliveries/${id}`, { signal }));
