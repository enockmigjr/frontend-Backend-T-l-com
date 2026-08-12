import { z } from 'zod';
import { apiRequest } from '@/lib/api/client';
import { envelope } from '@/features/users/api/validation';
import {
  agentPerformanceSchema,
  departmentsSchema,
  overviewSchema,
  prioritiesSchema,
  publicSupportSchema,
  resolutionSchema,
  slaSchema,
  statusesSchema,
  workloadSchema,
} from './schemas';

const schemas = {
  overview: overviewSchema,
  'tickets-by-status': statusesSchema,
  'tickets-by-priority': prioritiesSchema,
  'sla-compliance': slaSchema,
  workload: workloadSchema,
  'resolution-time': resolutionSchema,
  departments: departmentsSchema,
  'public-support': publicSupportSchema,
  'agent-performance': agentPerformanceSchema,
} as const;

function dashboardPayload<T>(raw: unknown, schema: z.ZodType<T>): T {
  const flattened = schema.safeParse(raw);
  if (flattened.success) return flattened.data;
  const wrapped = envelope(schema).safeParse(raw);
  if (wrapped.success) return wrapped.data.data;
  throw flattened.error;
}

export async function loadDashboard(from: string, to: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ from, to }).toString();
  const [
    overviewRaw,
    statusesRaw,
    prioritiesRaw,
    slaRaw,
    workloadRaw,
    resolutionRaw,
    departmentsRaw,
    publicSupportRaw,
    agentPerformanceRaw,
  ] =
    await Promise.all([
      apiRequest(`/api/v1/dashboard/overview?${query}`, { signal }),
      apiRequest(`/api/v1/dashboard/tickets-by-status?${query}`, { signal }),
      apiRequest(`/api/v1/dashboard/tickets-by-priority?${query}`, { signal }),
      apiRequest(`/api/v1/dashboard/sla-compliance?${query}`, { signal }),
      apiRequest('/api/v1/dashboard/workload', { signal }),
      apiRequest(`/api/v1/dashboard/resolution-time?${query}`, { signal }),
      apiRequest(`/api/v1/dashboard/departments?${query}`, { signal }),
      apiRequest('/api/v1/dashboard/public-support', { signal }),
      apiRequest(`/api/v1/dashboard/agent-performance?${query}`, { signal }),
    ]);
  return {
    overview: dashboardPayload(overviewRaw, schemas.overview),
    statuses: dashboardPayload(statusesRaw, schemas['tickets-by-status']),
    priorities: dashboardPayload(prioritiesRaw, schemas['tickets-by-priority']),
    sla: dashboardPayload(slaRaw, schemas['sla-compliance']),
    workload: dashboardPayload(workloadRaw, schemas.workload),
    resolution: dashboardPayload(resolutionRaw, schemas['resolution-time']),
    departments: dashboardPayload(departmentsRaw, schemas.departments),
    publicSupport: dashboardPayload(publicSupportRaw, schemas['public-support']),
    agentPerformance: dashboardPayload(agentPerformanceRaw, schemas['agent-performance']),
  };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
