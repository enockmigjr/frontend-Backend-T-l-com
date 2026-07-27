import { apiRequest } from '@/lib/api/client';
import { envelope, pageEnvelope, reportJobSchema, reportSchema } from '@/features/users/api/validation';
export const listReports = async (signal?: AbortSignal) =>
  pageEnvelope(reportSchema).parse(await apiRequest('/api/v1/reports?limit=50&order=desc', { signal }));
export const generateWeekly = async () =>
  envelope(reportJobSchema).parse(await apiRequest('/api/v1/reports/weekly/generate', { method: 'POST' }));
export const generateSla = async (from: string, to: string) =>
  envelope(reportJobSchema).parse(
    await apiRequest(`/api/v1/reports/sla/generate?${new URLSearchParams({ from, to })}`, {
      method: 'POST',
    }),
  );
export const generateTicket = async (id: string) =>
  envelope(reportJobSchema).parse(await apiRequest(`/api/v1/reports/ticket/${id}/generate`, { method: 'POST' }));
