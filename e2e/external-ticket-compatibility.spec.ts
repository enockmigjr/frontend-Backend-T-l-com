import { expect, test } from '@playwright/test';
import { adminCredentials, login, requireLocalCredentials } from './helpers';

const ticketId = '019fb400-0000-7000-8000-000000000001';
const requesterId = '019fb400-0000-7000-8000-000000000002';
const integrationId = '019fb400-0000-7000-8000-000000000003';
const categoryId = '019fb400-0000-7000-8000-000000000004';
const departmentId = '019fb400-0000-7000-8000-000000000005';
const slaPolicyId = '019fb400-0000-7000-8000-000000000006';

test('ouvre un ticket externe sans supposer un utilisateur interne', async ({ page }) => {
  test.skip(!adminCredentials && !process.env.CI, 'Identifiants admin locaux non configurés.');
  await login(page, requireLocalCredentials(adminCredentials, 'admin'));

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === `/api/v1/tickets/${ticketId}`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: publicTicket() }),
      });
      return;
    }
    if (path === `/api/v1/tickets/${ticketId}/comments`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [externalComment()], meta: pageMeta(1) }),
      });
      return;
    }
    if (path === `/api/v1/tickets/${ticketId}/history`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [systemHistory()] }),
      });
      return;
    }
    if (path === `/api/v1/tickets/${ticketId}/internal-notes` || path === `/api/v1/tickets/${ticketId}/attachments`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: pageMeta(0) }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`/tickets/${ticketId}`);
  await expect(page.getByRole('heading', { name: 'Coupure depuis PhotoVault' })).toBeVisible();
  await expect(page.getByText('Client PhotoVault', { exact: true })).toHaveCount(3);
  await expect(page.getByText('WordPress', { exact: true })).toBeVisible();
  await expect(page.getByText('Site PhotoVault', { exact: true })).toBeVisible();
  await expect(page.getByText('Automatisation système', { exact: true })).toBeVisible();
});

function publicTicket() {
  return {
    id: ticketId,
    ticketNumber: 'INC-PUBLIC-000001',
    title: 'Coupure depuis PhotoVault',
    description: 'Le demandeur signale une indisponibilité depuis le widget WordPress.',
    status: 'NEW',
    priority: 'MEDIUM',
    severity: 'S3',
    categoryId,
    categoryName: 'Support web',
    slaPolicyId,
    departmentId,
    assignedTeamId: departmentId,
    assignedTo: null,
    createdBy: null,
    openedByUserId: null,
    requesterId,
    supportIntegrationId: integrationId,
    requesterName: 'Client PhotoVault',
    integrationName: 'Site PhotoVault',
    sourceChannel: 'WORDPRESS',
    firstResponseDueAt: '2026-07-30T18:00:00.000Z',
    resolutionDueAt: '2026-07-31T18:00:00.000Z',
    slaBreached: false,
    createdAt: '2026-07-30T16:00:00.000Z',
    updatedAt: '2026-07-30T16:00:00.000Z',
  };
}

function externalComment() {
  return {
    id: '019fb400-0000-7000-8000-000000000007',
    ticketId,
    authorId: null,
    actorType: 'EXTERNAL_REQUESTER',
    externalRequesterId: requesterId,
    supportIntegrationId: integrationId,
    content: 'Le service reste indisponible depuis ce matin.',
    authorFirstName: null,
    authorLastName: null,
    authorRole: null,
    requesterName: 'Client PhotoVault',
    createdAt: '2026-07-30T16:01:00.000Z',
    updatedAt: '2026-07-30T16:01:00.000Z',
  };
}

function systemHistory() {
  return {
    id: '019fb400-0000-7000-8000-000000000008',
    ticketId,
    userId: null,
    actorType: 'SYSTEM',
    externalRequesterId: null,
    supportIntegrationId: integrationId,
    action: 'TICKET_CREATED',
    createdAt: '2026-07-30T16:00:00.000Z',
  };
}

function pageMeta(total: number) {
  return { page: 1, limit: 100, total, totalPages: total > 0 ? 1 : 0 };
}
