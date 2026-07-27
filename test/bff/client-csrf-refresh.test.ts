/** @jest-environment node */

import { apiRequest, resetCsrfToken } from '@/lib/api/client';

const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();

function csrfResponse(token: string): Response {
  return Response.json({ success: true, data: { csrfToken: token } });
}

describe('synchronisation CSRF après rotation de session', () => {
  beforeEach(() => {
    resetCsrfToken();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('utilise le nouveau jeton transmis par le BFF pour la mutation suivante', async () => {
    fetchMock
      .mockResolvedValueOnce(csrfResponse('csrf-before-refresh'))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        Response.json(
          { success: true, data: { id: 'profile' } },
          { headers: { 'x-csrf-token': 'csrf-after-refresh' } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await apiRequest('/api/v1/settings/theme', { method: 'PATCH', body: { value: 'compact' } });
    await apiRequest('/api/v1/users/me');
    await apiRequest('/api/v1/settings/theme', { method: 'PATCH', body: { value: 'comfortable' } });

    const nextMutationHeaders = new Headers(fetchMock.mock.calls[3]?.[1]?.headers);
    expect(nextMutationHeaders.get('x-csrf-token')).toBe('csrf-after-refresh');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
