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

export const mergePreviewSchema = z
  .object({
    requesterId: z.string(),
    moved: z.object({
      tickets: z.number(),
      conversations: z.number(),
      messages: z.number(),
      comments: z.number(),
      history: z.number(),
      trustedDevices: z.number(),
      identities: z.number(),
      verificationChallenges: z.number(),
      outboxEvents: z.number(),
      bootstrapGrants: z.number(),
      attachments: z.number(),
    }),
    identities: requesterIdentitySchema.array(),
    kept: z.object({
      auditEntries: z.number(),
      idempotencyRecords: z.number(),
    }),
  })
  .passthrough();

export const mergeResultSchema = z
  .object({
    merged: z.literal(true),
    targetRequesterId: z.string(),
    moved: z.record(z.string(), z.number()),
    identityCollisionsRemoved: z.number(),
    displayNameAdopted: z.string().nullable(),
  })
  .passthrough();

export type MergePreview = z.infer<typeof mergePreviewSchema>;

export interface RequesterFilters {
  readonly supportIntegrationId?: string;
  readonly search?: string;
  readonly anonymized?: 'true' | 'false';
}
