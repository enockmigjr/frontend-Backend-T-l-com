import { z } from 'zod';

export const deliveryStatusSchema = z.enum(['PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'DELIVERY_UNKNOWN']);

export const deliverySchema = z
  .object({
    id: z.string(),
    outboxEventId: z.string(),
    supportIntegrationId: z.string(),
    channel: z.string(),
    destinationKey: z.string(),
    status: deliveryStatusSchema,
    attemptCount: z.number(),
    providerMessageId: z.string().nullable(),
    lastError: z.string().nullable(),
    deliveredAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .passthrough();

export type ExternalDelivery = z.infer<typeof deliverySchema>;
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;

export interface DeliveryFilters {
  readonly supportIntegrationId?: string;
  readonly channel?: string;
  readonly status?: DeliveryStatus;
}
