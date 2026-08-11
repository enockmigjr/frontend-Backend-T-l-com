import { z } from 'zod';

export const requesterSchema = z
  .object({
    id: z.string(),
    supportIntegrationId: z.string(),
    displayName: z.string().nullable(),
    locale: z.string(),
    lastSeenAt: z.coerce.date().nullable(),
    anonymizedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .passthrough();

export const requesterIdentitySchema = z
  .object({
    identityType: z.string(),
    verifiedAt: z.coerce.date(),
    revokedAt: z.coerce.date().nullable(),
  })
  .passthrough();

export const requesterDetailSchema = requesterSchema.extend({
  summary: z.object({
    tickets: z.number(),
    conversations: z.number(),
    trustedDevices: z.number(),
    identities: requesterIdentitySchema.array(),
  }),
});

export type ExternalRequester = z.infer<typeof requesterSchema>;
export type ExternalRequesterDetail = z.infer<typeof requesterDetailSchema>;

export interface RequesterFilters {
  readonly supportIntegrationId?: string;
  readonly search?: string;
  readonly anonymized?: 'true' | 'false';
}
