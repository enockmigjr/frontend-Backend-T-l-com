import { z } from 'zod';
const period = z.object({ from: z.string(), to: z.string() }).passthrough();
const status = z.enum([
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
const priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const overviewSchema = z.object({
  period,
  ticketVolume: z.object({
    total: z.number().int(),
    openTickets: z.number().int(),
    resolvedToday: z.number().int(),
    createdToday: z.number().int(),
  }),
  byStatus: z.partialRecord(status, z.number().int()),
  byPriority: z.partialRecord(priority, z.number().int()),
  bySeverity: z.record(z.string(), z.number().int()),
  sla: z.object({
    totalTracked: z.number().int(),
    breached: z.number().int(),
    atRisk: z.number().int(),
    overdue: z.number().int().optional(),
    compliant: z.number().int(),
    complianceRate: z.number(),
  }),
});
export const statusesSchema = z.object({
  period,
  data: z.array(z.object({ status, count: z.number().int(), avgAgeMinutes: z.number(), percentage: z.number() })),
});
export const prioritiesSchema = z.object({
  period,
  data: z.array(z.object({ priority, count: z.number().int(), slaBreaches: z.number().int(), percentage: z.number() })),
});
export const slaSchema = z.object({
  period,
  summary: z.object({
    totalTracked: z.number().int(),
    compliant: z.number().int(),
    breached: z.number().int(),
    atRisk: z.number().int(),
    complianceRate: z.number(),
    firstResponseComplianceRate: z.number(),
  }),
  byPriority: z.array(z.object({ priority }).passthrough()),
  byCategory: z.array(z.object({ category: z.string() }).passthrough()),
});
export const workloadSchema = z.object({
  generatedAt: z.string(),
  summary: z.object({
    totalAgents: z.number().int(),
    totalOpenTickets: z.number().int(),
    absentAgentsCount: z.number().int().optional(),
    avgTicketsPerAgent: z.number(),
    unassignedTickets: z.number().int(),
  }),
  data: z.array(
    z.object({
      agentId: z.string().uuid(),
      firstName: z.string().nullable().optional(),
      lastName: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      isAvailable: z.boolean().nullable().optional(),
      absenceEndsAt: z.string().nullable().optional(),
      openTicketsCount: z.number().int(),
      criticalTicketsCount: z.number().int(),
      highTicketsCount: z.number().int(),
      slaAtRiskCount: z.number().int(),
      overdueTicketsCount: z.number().int().optional(),
      lastActivityAt: z.string().nullable().optional(),
    }),
  ),
});
export const resolutionSchema = z.object({
  period,
  overall: z.object({
    avgResolutionTimeMinutes: z.number(),
    medianResolutionTimeMinutes: z.number(),
    p90ResolutionTimeMinutes: z.number(),
    resolvedCount: z.number().int().optional(),
  }),
  trend: z.array(z.object({ period: z.string(), avgResolutionTimeMinutes: z.number() })),
});
export const departmentsSchema = z.object({
  period,
  data: z.array(
    z.object({
      departmentId: z.string().uuid().nullable(),
      departmentName: z.string().nullable().optional(),
      total: z.coerce.number().int(),
      open: z.coerce.number().int(),
      resolved: z.coerce.number().int(),
      closed: z.coerce.number().int(),
      slaCompliant: z.coerce.number().int(),
      slaBreached: z.coerce.number().int(),
      avgResolutionMinutes: z.coerce.number().optional(),
    }),
  ),
});
