import { TicketList } from '@/features/tickets/ticket-list';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TicketsPage({ searchParams }: Readonly<{ searchParams: SearchParams }>) {
  const raw = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const filters = {
    page: Number(first(raw.page) ?? 1),
    limit: 20,
    search: first(raw.search),
    status: first(raw.status),
    priority: first(raw.priority),
    sort: 'updatedAt',
    order: 'desc',
  };
  const query = new URLSearchParams(
    Object.entries(filters)
      .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  return <TicketList filters={filters} query={query} />;
}
