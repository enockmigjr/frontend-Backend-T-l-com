import { z } from 'zod';
import { apiRequest } from '@/lib/api/client';
import { envelope } from '@/features/users/api/validation';
import {
  departmentsSchema,
  overviewSchema,
  prioritiesSchema,
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
} as const;

function dashboardPayload<T>(raw: unknown, schema: z.ZodType<T>): T {
  const wrapped = envelope(schema).safeParse(raw);
  if (wrapped.success) return wrapped.data.data;

  // Le backend conserve les DTO de série contenant `data` au niveau racine.
  // Cette branche reflète le runtime sans affaiblir la validation du payload.
  const flattened = schema.safeParse(raw);
  if (flattened.success) return flattened.data;

  return envelope(schema).parse(raw).data;
}

export async function loadDashboard(from: string, to: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ from, to }).toString();
  const [overviewRaw, statusesRaw, prioritiesRaw, slaRaw, workloadRaw, resolutionRaw, departmentsRaw] =
    await Promise.all([
      apiRequest(`/api/v1/dashboard/overview?${query}`, { signal }),
      apiRequest(`/api/v1/dashboard/tickets-by-status?${query}`, { signal }),
      apiRequest(`/api/v1/dashboard/tickets-by-priority?${query}`, { signal }),
      apiRequest(`/api/v1/dashboard/sla-compliance?${query}`, { signal }),
      apiRequest('/api/v1/dashboard/workload', { signal }),
      apiRequest(`/api/v1/dashboard/resolution-time?${query}`, { signal }),
      apiRequest(`/api/v1/dashboard/departments?${query}`, { signal }),
    ]);
  const overview = dashboardPayload(overviewRaw, schemas.overview);
  const statuses = dashboardPayload(statusesRaw, schemas['tickets-by-status']);
  const priorities = dashboardPayload(prioritiesRaw, schemas['tickets-by-priority']);
  const sla = dashboardPayload(slaRaw, schemas['sla-compliance']);
  const workload = dashboardPayload(workloadRaw, schemas.workload);
  const resolution = dashboardPayload(resolutionRaw, schemas['resolution-time']);
  const departments = dashboardPayload(departmentsRaw, schemas.departments);
  return { overview, statuses, priorities, sla, workload, resolution, departments };
}
export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
