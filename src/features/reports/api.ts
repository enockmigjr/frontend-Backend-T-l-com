import { z } from 'zod';
import { apiRequest } from '@/lib/api/client';
import { envelope, pageEnvelope, reportJobSchema, reportSchema } from '@/features/users/api/validation';

const jobResponseSchema = reportJobSchema.extend({
  success: z.literal(true),
  statusCode: z.number().optional(),
});
const ticketReportSchema = z.object({
  generatedAt: z.string(),
  type: z.literal('ticket-report'),
  ticket: z.record(z.string(), z.unknown()),
});
const slaReportSchema = z.object({
  generatedAt: z.string(),
  type: z.literal('sla-report'),
  period: z.object({ from: z.string(), to: z.string() }),
  summary: z.object({
    total: z.coerce.number(),
    breached: z.coerce.number(),
    avgResolutionMinutes: z.coerce.number(),
  }),
  byPriority: z.array(z.record(z.string(), z.unknown())),
});

export const listReports = async (signal?: AbortSignal) =>
  pageEnvelope(reportSchema).parse(await apiRequest('/api/v1/reports?limit=50&order=desc', { signal }));
export const getReport = async (id: string, signal?: AbortSignal) =>
  envelope(reportSchema).parse(await apiRequest(`/api/v1/reports/${id}`, { signal }));

async function generate(path: string) {
  const data = jobResponseSchema.parse(await apiRequest(path, { method: 'POST' }));
  return { ...data, data };
}

export const generateWeekly = async () => generate('/api/v1/reports/weekly/generate');
export const generateSla = async (from: string, to: string) =>
  generate(`/api/v1/reports/sla/generate?${new URLSearchParams({ from, to })}`);
export const generateTicket = async (id: string) => generate(`/api/v1/reports/ticket/${id}/generate`);
export const getTicketReport = async (id: string) =>
  envelope(ticketReportSchema).parse(await apiRequest(`/api/v1/reports/ticket/${id}`));
export const getSlaReport = async (from: string, to: string) =>
  envelope(slaReportSchema).parse(await apiRequest(`/api/v1/reports/sla?${new URLSearchParams({ from, to })}`));

export type TicketReportDetail = z.infer<typeof ticketReportSchema>;
export type SlaReportDetail = z.infer<typeof slaReportSchema>;
