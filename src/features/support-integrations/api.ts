import { apiRequest } from '@/lib/api/client';
import { envelope, pageEnvelope } from '@/features/users/api/validation';
import {
  integrationCredentialSchema,
  integrationSchema,
  rotationSchema,
  trustedDeviceSchema,
  type SupportIntegration,
} from './types';

type CreateBody = {
  readonly name: string;
  readonly allowedOrigins: readonly string[];
  readonly trustPolicy?: { readonly trustedDeviceDays?: number };
  readonly features?: { readonly attachments?: boolean; readonly realtime?: boolean; readonly bot?: boolean };
  readonly routingPolicy?: Readonly<Record<string, unknown>>;
  readonly quotaPolicy?: Readonly<Record<string, unknown>>;
};

export const listIntegrations = async (signal?: AbortSignal) =>
  envelope(integrationSchema.array()).parse(await apiRequest('/api/v1/support-integrations', { signal }));

export const createIntegration = async (body: CreateBody) =>
  envelope(integrationSchema).parse(await apiRequest('/api/v1/support-integrations', { method: 'POST', body }));

export const updateIntegration = async (id: string, body: CreateBody & { readonly status?: string }) =>
  envelope(integrationSchema).parse(await apiRequest(`/api/v1/support-integrations/${id}`, { method: 'PATCH', body }));

export const rotateIntegrationSecret = async (id: string, secret: string) =>
  envelope(rotationSchema).parse(
    await apiRequest(`/api/v1/support-integrations/${id}/credentials/rotate`, {
      method: 'POST',
      body: { secret },
      idempotencyKey: crypto.randomUUID(),
    }),
  );

export const listCredentials = async (id: string, signal?: AbortSignal) =>
  envelope(integrationCredentialSchema.array()).parse(
    await apiRequest(`/api/v1/support-integrations/${id}/credentials`, { signal }),
  );

export const revokeCredential = async (id: string, credentialId: string) =>
  apiRequest(`/api/v1/support-integrations/${id}/credentials/${credentialId}/revoke`, {
    method: 'POST',
    idempotencyKey: crypto.randomUUID(),
  });

export const listDevices = async (id: string, page = 1, limit = 25, signal?: AbortSignal) =>
  pageEnvelope(trustedDeviceSchema).parse(
    await apiRequest(`/api/v1/support-integrations/${id}/devices?page=${page}&limit=${limit}`, { signal }),
  );

export const revokeDevice = async (id: string, deviceId: string) =>
  apiRequest(`/api/v1/support-integrations/${id}/devices/${deviceId}/revoke`, {
    method: 'POST',
    idempotencyKey: crypto.randomUUID(),
  });

export type { SupportIntegration };
