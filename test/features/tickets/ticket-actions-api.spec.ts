import { apiRequest } from '@/features/auth/api-client';
import { ticketsApi } from '@/features/tickets/api';

jest.mock('@/features/auth/api-client', () => ({ apiRequest: jest.fn(), apiPage: jest.fn() }));

const id = '550e8400-e29b-41d4-a716-446655440000';

describe('mutations tickets', () => {
  afterEach(() => jest.clearAllMocks());

  it('envoie le DTO d’escalade exact avec une clé idempotency', async () => {
    await ticketsApi.escalate(id, id, id, 'Expertise réseau requise');
    expect(apiRequest).toHaveBeenCalledWith(
      `/api/v1/tickets/${id}/escalate`,
      expect.anything(),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Idempotency-Key': expect.any(String) },
        body: JSON.stringify({ userId: id, departmentId: id, reason: 'Expertise réseau requise' }),
      }),
    );
  });

  it('utilise DELETE sur la route de soft-delete sans inventer de payload', async () => {
    await ticketsApi.remove(id);
    expect(apiRequest).toHaveBeenCalledWith(`/api/v1/tickets/${id}`, expect.anything(), { method: 'DELETE' });
  });

  it('envoie le DTO de réassignation autorisé à l’assigné actuel', async () => {
    await ticketsApi.assign(id, 'reassign', id, 'Relais vers le niveau 2');
    expect(apiRequest).toHaveBeenCalledWith(
      `/api/v1/tickets/${id}/reassign`,
      expect.anything(),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ userId: id, reason: 'Relais vers le niveau 2' }),
      }),
    );
  });
});
