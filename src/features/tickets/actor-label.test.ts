import { actorLabel, sourceChannelLabel, ticketOpenerLabel } from './actor-label';
import { ticketSchema } from './schemas';

describe("libellés d'acteur", () => {
  it('distingue acteur interne, demandeur et système sans exposer les identifiants', () => {
    expect(actorLabel({ actorType: 'INTERNAL', userId: 'secret' }, 'Awa Mensah')).toBe('Awa Mensah');
    expect(actorLabel({ actorType: 'EXTERNAL_REQUESTER', externalRequesterId: 'secret' })).toBe('Demandeur externe');
    expect(actorLabel({ actorType: 'EXTERNAL_REQUESTER' }, null, 'Client PhotoVault')).toBe('Client PhotoVault');
    expect(actorLabel({ actorType: 'SYSTEM' })).toBe('Automatisation système');
  });

  it('affiche le demandeur minimal et le canal public', () => {
    const ticket = ticketSchema.parse({
      id: '019fa300-b253-7004-84d0-b99726668250',
      ticketNumber: 'INC-2026-000001',
      title: 'Incident public',
      description: 'Description suffisamment détaillée.',
      priority: 'MEDIUM',
      severity: 'S3',
      status: 'NEW',
      categoryId: '019fa300-b253-7004-84d0-b99726668251',
      slaPolicyId: '019fa300-b253-7004-84d0-b99726668252',
      departmentId: '019fa300-b253-7004-84d0-b99726668253',
      assignedTeamId: '019fa300-b253-7004-84d0-b99726668254',
      assignedTo: null,
      createdBy: null,
      openedByUserId: null,
      requesterId: '019fa300-b253-7004-84d0-b9972666825f',
      requesterName: 'Client PhotoVault',
      sourceChannel: 'WORDPRESS',
      createdAt: '2026-07-30T10:00:00.000Z',
      updatedAt: '2026-07-30T10:00:00.000Z',
    });
    expect(ticketOpenerLabel(ticket)).toBe('Client PhotoVault');
    expect(sourceChannelLabel(ticket.sourceChannel)).toBe('WordPress');
  });
});
