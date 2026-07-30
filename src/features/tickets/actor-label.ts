import type { Ticket } from './schemas';

type ActorType = 'INTERNAL' | 'EXTERNAL_REQUESTER' | 'SYSTEM';

interface ActorDisplay {
  readonly actorType?: ActorType;
  readonly userId?: string | null;
  readonly authorId?: string | null;
  readonly uploadedBy?: string | null;
  readonly externalRequesterId?: string | null;
}

const channelLabels: Readonly<Record<string, string>> = {
  INTERNAL: 'Console interne',
  WEB_PORTAL: 'Portail web',
  WIDGET: 'Widget',
  WORDPRESS: 'WordPress',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  API: 'API',
};

export function actorLabel(actor: ActorDisplay, internalName?: string | null, externalName?: string | null): string {
  if (actor.actorType === 'SYSTEM') return 'Automatisation système';
  if (actor.actorType === 'EXTERNAL_REQUESTER') return externalName?.trim() || 'Demandeur externe';
  return internalName?.trim() || 'Utilisateur interne';
}

export function ticketOpenerLabel(ticket: Ticket): string {
  const creatorName =
    ticket.creatorName ??
    (ticket.creator ? `${ticket.creator.firstName} ${ticket.creator.lastName}`.trim() : undefined);
  if (ticket.openedByUserId || ticket.createdBy) return creatorName || 'Utilisateur interne';
  if (ticket.requesterId) return ticket.requesterName || 'Demandeur externe';
  return 'Automatisation système';
}

export function sourceChannelLabel(channel?: string): string {
  return channelLabels[channel ?? 'INTERNAL'] ?? 'Canal externe';
}
