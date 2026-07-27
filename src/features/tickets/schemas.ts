import { z } from 'zod';

export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const severitySchema = z.enum(['S1', 'S2', 'S3', 'S4']);
export const statusSchema = z.enum([
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'PENDING_CUSTOMER',
  'PENDING_THIRD_PARTY',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'CANCELLED',
]);

export const ticketListItemSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(),
  title: z.string(),
  priority: prioritySchema,
  severity: severitySchema,
  status: statusSchema,
  categoryId: z.string().uuid(),
  categoryName: z.string().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  customerName: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const namedEntitySchema = z.object({ id: z.string().uuid(), name: z.string() }).passthrough();
const userSchema = z
  .object({ id: z.string().uuid(), firstName: z.string(), lastName: z.string(), email: z.string(), role: z.string() })
  .passthrough();

export const ticketSchema = ticketListItemSchema
  .extend({
    description: z.string(),
    assignedTeamId: z.string().uuid(),
    departmentId: z.string().uuid(),
    createdBy: z.string().uuid(),
    slaPolicyId: z.string().uuid(),
    tags: z.string().nullable().optional(),
    customerAccountNumber: z.string().nullable().optional(),
    customerContact: z.string().nullable().optional(),
    resolutionSummary: z.string().nullable().optional(),
    firstResponseDueAt: z.string().optional(),
    resolutionDueAt: z.string().optional(),
    resolvedAt: z.string().nullable().optional(),
    closedAt: z.string().nullable().optional(),
    slaBreached: z.boolean().optional(),
    assigneeName: z.string().nullable().optional(),
    departmentName: z.string().nullable().optional(),
    category: namedEntitySchema.optional(),
    department: namedEntitySchema.optional(),
    assignedTeam: namedEntitySchema.optional(),
    assignee: userSchema.optional(),
    creator: userSchema.optional(),
  })
  .passthrough();

export const commentSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  authorId: z.string().uuid(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authorFirstName: z.string().optional(),
  authorLastName: z.string().optional(),
  authorRole: z.string().optional(),
});
export const noteSchema = commentSchema.extend({
  updatedAt: z.string().optional(),
  authorName: z.string().optional(),
});
export const attachmentSchema = z
  .object({
    id: z.string().uuid(),
    originalFilename: z.string(),
    mimeType: z.string(),
    fileSize: z.number(),
    uploadedBy: z.string().uuid(),
    createdAt: z.string(),
  })
  .passthrough();
export const historySchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.string(),
  createdAt: z.string(),
  oldValue: z.unknown().nullable().optional(),
  newValue: z.unknown().nullable().optional(),
  metadata: z.unknown().nullable().optional(),
});
export const categorySchema = namedEntitySchema;
export const departmentSchema = namedEntitySchema;
export const userReferenceSchema = userSchema.extend({ departmentId: z.string().uuid(), isActive: z.boolean() });

export const createTicketSchema = z.object({
  title: z.string().trim().min(5, 'Au moins 5 caractères.').max(255),
  description: z.string().trim().min(10, "Décrivez l'incident en au moins 10 caractères."),
  priority: prioritySchema,
  severity: severitySchema,
  categoryId: z.string().uuid('Sélectionnez une catégorie.'),
  departmentId: z.string().uuid('Sélectionnez un département.'),
  assignedTeamId: z.string().uuid('Sélectionnez une équipe.'),
  customerAccountNumber: z.string().trim().optional(),
  customerName: z.string().trim().optional(),
  customerContact: z.string().trim().optional(),
  tags: z.string().trim().optional(),
});

export const contentSchema = z.object({ content: z.string().trim().min(2, 'Le contenu est trop court.').max(5000) });
export const reasonSchema = z.object({
  reason: z.string().trim().min(10, 'Précisez la raison (10 caractères minimum).'),
});
export const resolveSchema = z.object({
  resolutionSummary: z.string().trim().min(5, 'Précisez la résolution.').max(5000),
});

export type Ticket = z.infer<typeof ticketSchema>;
export type TicketListItem = z.infer<typeof ticketListItemSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type TicketStatus = z.infer<typeof statusSchema>;
