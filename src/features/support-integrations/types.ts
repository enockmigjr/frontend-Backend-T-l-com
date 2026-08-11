import { z } from 'zod';

export const integrationStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED']);

export const integrationSchema = z
  .object({
    id: z.string(),
    publicKey: z.string(),
    name: z.string(),
    status: integrationStatusSchema,
    allowedOrigins: z.array(z.string()),
    appearance: z.record(z.string(), z.unknown()),
    routingPolicy: z.record(z.string(), z.unknown()),
    quotaPolicy: z.record(z.string(), z.unknown()),
    trustPolicy: z.record(z.string(), z.unknown()),
    features: z.record(z.string(), z.boolean()),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .passthrough();

export type SupportIntegration = z.infer<typeof integrationSchema>;
export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;

export const integrationCredentialSchema = z
  .object({
    id: z.string(),
    version: z.number(),
    activeFrom: z.coerce.date().nullable(),
    revokedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
  })
  .passthrough();

export type IntegrationCredential = z.infer<typeof integrationCredentialSchema>;

export const trustedDeviceSchema = z
  .object({
    id: z.string(),
    externalRequesterId: z.string(),
    policyVersion: z.number(),
    expiresAt: z.coerce.date().nullable(),
    lastUsedAt: z.coerce.date().nullable(),
    revokedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
  })
  .passthrough();

export type TrustedDevice = z.infer<typeof trustedDeviceSchema>;

export const rotationSchema = z
  .object({
    credentialId: z.string(),
    version: z.number(),
    previousValidUntil: z.coerce.date().nullable(),
  })
  .passthrough();
