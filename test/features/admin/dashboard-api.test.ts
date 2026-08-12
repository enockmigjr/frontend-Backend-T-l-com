import { loadDashboard } from '@/features/dashboard/api/dashboard-api';
import { apiRequest } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({ apiRequest: jest.fn() }));
const request = jest.mocked(apiRequest);

describe('loadDashboard', () => {
  it('interroge exactement les neuf endpoints réels avec la période', async () => {
    const period = { from: '2026-06-01', to: '2026-06-30' };
    request.mockImplementation(async (path) => {
      const base = { success: true, statusCode: 200 };
      if (path.includes('overview'))
        return {
          ...base,
          data: {
            period,
            ticketVolume: { total: 1, openTickets: 1, resolvedToday: 0, createdToday: 1 },
            byStatus: {},
            byPriority: {},
            bySeverity: {},
            sla: { totalTracked: 0, breached: 0, atRisk: 0, compliant: 0, complianceRate: 100 },
          },
        };
      if (path.includes('tickets-by-status')) return { ...base, data: { period, data: [] } };
      if (path.includes('tickets-by-priority')) return { ...base, data: { period, data: [] } };
      if (path.includes('sla-compliance'))
        return {
          ...base,
          data: {
            period,
            summary: {
              totalTracked: 0,
              compliant: 0,
              breached: 0,
              atRisk: 0,
              complianceRate: 100,
              firstResponseComplianceRate: 100,
            },
            byPriority: [],
            byCategory: [],
          },
        };
      if (path.includes('workload'))
        return {
          ...base,
          data: {
            generatedAt: '2026-06-30T00:00:00Z',
            summary: { totalAgents: 0, totalOpenTickets: 0, avgTicketsPerAgent: 0, unassignedTickets: 0 },
            data: [],
          },
        };
      if (path.includes('resolution-time'))
        return {
          ...base,
          data: {
            period,
            overall: { avgResolutionTimeMinutes: 0, medianResolutionTimeMinutes: 0, p90ResolutionTimeMinutes: 0 },
            trend: [],
          },
        };
      if (path.includes('public-support'))
        return {
          ...base,
          data: {
            generatedAt: '2026-06-30T00:00:00Z',
            summary: {
              totalConversations: 0,
              openConversations: 0,
              conversationsToday: 0,
              totalRequesters: 0,
              activeRequesters: 0,
              totalMessages: 0,
              publicRepliesSent: 0,
              publicTickets: 0,
              openPublicTickets: 0,
              avgFirstResponseMinutes: 0,
            },
            byChannel: [],
            byStatus: [],
            recentRequesters: [],
          },
        };
      if (path.includes('agent-performance'))
        return {
          ...base,
          data: {
            generatedAt: '2026-06-30T00:00:00Z',
            period,
            data: [],
          },
        };
      return { ...base, data: { period, data: [] } };
    });
    await loadDashboard('2026-06-01', '2026-06-30');
    expect(request).toHaveBeenCalledTimes(9);
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/dashboard/overview?from=2026-06-01&to=2026-06-30',
      '/api/v1/dashboard/tickets-by-status?from=2026-06-01&to=2026-06-30',
      '/api/v1/dashboard/tickets-by-priority?from=2026-06-01&to=2026-06-30',
      '/api/v1/dashboard/sla-compliance?from=2026-06-01&to=2026-06-30',
      '/api/v1/dashboard/workload',
      '/api/v1/dashboard/resolution-time?from=2026-06-01&to=2026-06-30',
      '/api/v1/dashboard/departments?from=2026-06-01&to=2026-06-30',
      '/api/v1/dashboard/public-support',
      '/api/v1/dashboard/agent-performance?from=2026-06-01&to=2026-06-30',
    ]);
  });
});
