import { createTicketSchema, ticketSchema } from '@/features/tickets/schemas';

const id = '550e8400-e29b-41d4-a716-446655440000';

describe('contrats tickets', () => {
  it('accepte une création complète conforme au contrat', () => {
    const result = createTicketSchema.safeParse({
      title: 'Coupure fibre secteur Nord',
      description: 'La liaison principale ne répond plus depuis 08h30.',
      priority: 'HIGH',
      severity: 'S2',
      categoryId: id,
      departmentId: id,
      assignedTeamId: id,
      customerName: 'Entreprise Exemple',
      tags: 'fibre,nord',
    });
    expect(result.success).toBe(true);
  });

  it('rejette une création dont les références ne sont pas des UUID', () => {
    const result = createTicketSchema.safeParse({
      title: 'Coupure fibre',
      description: 'Incident suffisamment détaillé.',
      priority: 'HIGH',
      severity: 'S2',
      categoryId: 'cat-1',
      departmentId: 'dep-1',
      assignedTeamId: 'dep-2',
    });
    expect(result.success).toBe(false);
  });

  it('rejette une réponse serveur avec un statut inconnu', () => {
    const result = ticketSchema.safeParse({
      id,
      ticketNumber: 'TIC-2026-0001',
      title: 'Incident',
      description: 'Description',
      priority: 'HIGH',
      severity: 'S2',
      status: 'DONE',
      categoryId: id,
      assignedTeamId: id,
      departmentId: id,
      createdBy: id,
      slaPolicyId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
