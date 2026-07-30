import type { CurrentUser } from '@/lib/auth/session';
import { canEditTicket, canReopenTicket } from './permissions';
import { ticketSchema, type Ticket } from './schemas';

const userId = '019f89e0-32f1-7ff5-baa4-ed98c12afcba';
const otherUserId = '019fa300-bf59-7004-84d2-4693443980af';
const requesterId = '019fa300-b253-7004-84d0-b9972666825f';

const user: CurrentUser = {
  id: userId,
  email: 'agent@telecom.local',
  firstName: 'Agent',
  lastName: 'Interne',
  role: 'CUSTOMER_SERVICE_AGENT',
};

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return ticketSchema.parse({
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
    createdBy: userId,
    openedByUserId: userId,
    createdAt: '2026-07-30T10:00:00.000Z',
    updatedAt: '2026-07-30T10:00:00.000Z',
    ...overrides,
  });
}

describe('permissions ticket avec acteurs multiples', () => {
  it('utilise openedByUserId comme propriétaire interne', () => {
    expect(canEditTicket(ticket({ createdBy: otherUserId, openedByUserId: userId }), user)).toBe(true);
    expect(canEditTicket(ticket({ createdBy: userId, openedByUserId: otherUserId }), user)).toBe(false);
  });

  it('conserve le fallback legacy lorsque openedByUserId est absent', () => {
    expect(canEditTicket(ticket({ openedByUserId: undefined, createdBy: userId }), user)).toBe(true);
  });

  it('ne traite jamais un demandeur externe comme propriétaire agent', () => {
    const publicTicket = ticket({ createdBy: null, openedByUserId: null, requesterId, sourceChannel: 'WIDGET' });
    expect(canEditTicket(publicTicket, user)).toBe(false);
    expect(canReopenTicket({ ...publicTicket, status: 'CLOSED', closedAt: new Date().toISOString() }, user)).toBe(
      false,
    );
  });
});
