import type { CurrentUser } from '@/lib/auth/session';
import {
  canDeleteTicket,
  canEditTicket,
  canOperate,
  canReopenTicket,
  editableFields,
} from '@/features/tickets/permissions';
import { ticketSchema } from '@/features/tickets/schemas';

const id = '550e8400-e29b-41d4-a716-446655440000';
const otherId = '550e8400-e29b-41d4-a716-446655440001';
const baseUser: CurrentUser = {
  id,
  email: 'agent@example.test',
  firstName: 'Test',
  lastName: 'Agent',
  departmentId: id,
  role: 'CUSTOMER_SERVICE_AGENT',
  mustChangePassword: false,
};
const ticket = ticketSchema.parse({
  id: otherId,
  ticketNumber: 'TIC-2026-1',
  title: 'Incident',
  description: 'Description',
  priority: 'HIGH',
  severity: 'S2',
  status: 'RESOLVED',
  categoryId: id,
  assignedTeamId: id,
  departmentId: id,
  createdBy: id,
  assignedTo: id,
  slaPolicyId: id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('permissions des actions ticket', () => {
  it('autorise l’assigné actuel à clôturer via les actions opérationnelles', () => {
    expect(canOperate(ticket, baseUser)).toBe(true);
  });

  it('autorise le créateur Customer Service à rouvrir dans les 30 jours', () => {
    const now = Date.now();
    const closed = { ...ticket, status: 'CLOSED' as const, closedAt: new Date(now - 29 * 86_400_000).toISOString() };
    expect(canReopenTicket(closed, baseUser, now)).toBe(true);
    expect(canReopenTicket({ ...closed, closedAt: new Date(now - 31 * 86_400_000).toISOString() }, baseUser, now)).toBe(
      false,
    );
  });

  it('ne permet la suppression logique qu’à l’administrateur', () => {
    expect(canDeleteTicket(baseUser)).toBe(false);
    expect(canDeleteTicket({ ...baseUser, role: 'ADMINISTRATOR' })).toBe(true);
  });

  it('limite les champs du créateur d’un ticket NEW au contrat backend', () => {
    const created = { ...ticket, status: 'NEW' as const, assignedTo: null };
    expect(canEditTicket(created, baseUser)).toBe(true);
    expect([...editableFields(created, baseUser)].sort()).toEqual(['categoryId', 'description', 'title']);
  });

  it('réserve priorité et sévérité à la supervision', () => {
    const fields = editableFields(ticket, { ...baseUser, role: 'SUPERVISOR' });
    expect(fields.has('priority')).toBe(true);
    expect(fields.has('severity')).toBe(true);
  });
});
