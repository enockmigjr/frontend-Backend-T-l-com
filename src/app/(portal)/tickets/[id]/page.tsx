import { TicketDetail } from '@/features/tickets/ticket-detail';

export default async function TicketDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <TicketDetail id={id} />;
}
