import { z } from 'zod';

export const roleSchema = z.enum([
  'CUSTOMER_SERVICE_AGENT',
  'NOC_ENGINEER',
  'BILLING_AGENT',
  'TECHNICAL_SUPPORT_ENGINEER',
  'FIELD_TECHNICIAN',
  'SUPERVISOR',
  'ADMINISTRATOR',
]);
export const createUserInputSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  role: roleSchema,
  departmentId: z.string().uuid(),
});
export const userSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: roleSchema,
    departmentId: z.string().uuid(),
    departmentName: z.string().nullable().optional(),
    isActive: z.boolean(),
    tempPassword: z.string().optional(),
  })
  .passthrough();
export const createdUserSchema = userSchema.extend({
  isActive: z.boolean().optional().default(true),
  tempPassword: z.string(),
});
export const userDetailSchema = userSchema.extend({
  department: z
    .object({
      id: z.string().uuid().nullable(),
      name: z.string().nullable(),
      description: z.string().nullable(),
    })
    .nullable()
    .optional(),
  ticketStats: z
    .object({
      totalCreated: z.coerce.number(),
      totalAssigned: z.coerce.number(),
      openTickets: z.coerce.number(),
      resolvedTickets: z.coerce.number(),
      slaBreachedCount: z.coerce.number(),
    })
    .optional(),
  recentTickets: z
    .array(
      z.object({
        id: z.string().uuid(),
        ticketNumber: z.string(),
        title: z.string(),
        status: z.string(),
        priority: z.string(),
        createdAt: z.string(),
        slaBreached: z.boolean(),
      }),
    )
    .optional(),
});
export const departmentSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    autoAssignmentEnabled: z.boolean(),
    assignmentStrategy: z.string(),
    maxWorkloadPerAgent: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();
export const categorySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    targetRole: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();
export const slaPolicySchema = z
  .object({
    id: z.string().uuid(),
    categoryId: z.string().uuid(),
    categoryName: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    firstResponseMinutes: z.number().int().positive(),
    resolutionMinutes: z.number().int().positive(),
  })
  .passthrough();
export const settingSchema = z
  .object({
    id: z.string().uuid(),
    key: z.string(),
    value: z.string(),
    description: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();
export const auditSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid().nullable(),
    actorType: z.enum(['INTERNAL', 'EXTERNAL_REQUESTER', 'SYSTEM']).default('INTERNAL'),
    externalRequesterId: z.string().uuid().nullable().optional(),
    supportIntegrationId: z.string().uuid().nullable().optional(),
    action: z.string(),
    entityType: z.string(),
    entityId: z.string().uuid(),
    createdAt: z.string(),
    oldValue: z.unknown().optional(),
    newValue: z.unknown().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
  })
  .passthrough();
export const reportSchema = z
  .object({
    id: z.string().uuid(),
    type: z.enum(['ticket-report', 'sla-report', 'weekly-report']),
    status: z.enum(['pending', 'completed', 'failed']),
    requestedBy: z.string().uuid(),
    createdAt: z.string(),
    errorMessage: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    objectKey: z.string().nullable().optional(),
  })
  .passthrough();
export const reportJobSchema = z.object({ reportId: z.string().uuid(), message: z.string() });
export const actionSchema = z.object({ success: z.literal(true), message: z.string().optional() });
export const envelope = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), statusCode: z.number().optional(), message: z.string().optional(), data });
export const pageEnvelope = <T extends z.ZodType>(item: T) =>
  envelope(z.array(item)).extend({
    meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }),
  });
