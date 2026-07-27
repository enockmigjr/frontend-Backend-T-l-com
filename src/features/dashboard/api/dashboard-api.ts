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
  const overview = envelope(schemas.overview).parse(overviewRaw).data;
  const statuses = envelope(schemas['tickets-by-status']).parse(statusesRaw).data;
  const priorities = envelope(schemas['tickets-by-priority']).parse(prioritiesRaw).data;
  const sla = envelope(schemas['sla-compliance']).parse(slaRaw).data;
  const workload = envelope(schemas.workload).parse(workloadRaw).data;
  const resolution = envelope(schemas['resolution-time']).parse(resolutionRaw).data;
  const departments = envelope(schemas.departments).parse(departmentsRaw).data;
  return { overview, statuses, priorities, sla, workload, resolution, departments };
}
export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
