'use client';

import { Copy, ExternalLink, MoreHorizontal, Play } from 'lucide-react';
import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Panel } from '@/components/ui/panel';
import { toast } from '@/components/ui/toast';
import { formatDate, formatRemaining } from './presentation';
import type { TicketListItem } from './schemas';
import { TicketPriorityBadge, TicketStatusBadge } from './ticket-badges';

export function TicketRow({
  ticket,
  teamName,
  canStart,
  onStart,
}: Readonly<{ ticket: TicketListItem; teamName?: string | null; canStart: boolean; onStart: () => void }>) {
  const overdue =
    ticket.slaBreached || (ticket.resolutionDueAt ? new Date(ticket.resolutionDueAt).getTime() < Date.now() : false);
  return (
    <tr className="group hover:bg-muted/25">
      <td className="px-4 py-3.5">
        <Link href={`/tickets/${ticket.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
          {ticket.ticketNumber}
        </Link>
        <p className="mt-1 max-w-md truncate font-medium">{ticket.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {ticket.categoryName ?? 'Sans catégorie'} · {ticket.customerName ?? 'Client non renseigné'}
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-1.5">
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium">{ticket.assigneeName || 'Non assigné'}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {teamName || ticket.departmentName || 'Équipe non renseignée'}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className={overdue ? 'font-semibold text-red-700' : 'font-medium'}>
          {formatRemaining(ticket.resolutionDueAt)}
        </p>
        {ticket.resolutionDueAt ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(ticket.resolutionDueAt)}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formatDate(ticket.updatedAt)}</td>
      <td className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="ghost" size="icon" aria-label={`Actions pour ${ticket.ticketNumber}`} />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/tickets/${ticket.id}`} />}>
              <ExternalLink /> Ouvrir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(ticket.ticketNumber);
                toast.add({ title: 'Référence copiée' });
              }}
            >
              <Copy /> Copier la référence
            </DropdownMenuItem>
            {canStart ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onStart}>
                  <Play /> Démarrer le traitement
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

export function PageSize({ query, current }: Readonly<{ query: string; current: number }>) {
  const router = useRouter();
  const [custom, setCustom] = useState(String(current));
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[10, 20, 50].map((size) => {
        const params = new URLSearchParams(query);
        params.set('limit', String(size));
        params.set('page', '1');
        return (
          <Button
            key={size}
            nativeButton={false}
            size="sm"
            className="hidden sm:inline-flex"
            variant={current === size ? 'secondary' : 'ghost'}
            render={<Link href={{ pathname: '/tickets', query: Object.fromEntries(params) }} />}
          >
            {size}
          </Button>
        );
      })}
      <form
        className="ml-1 flex items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          const value = Math.min(100, Math.max(1, Number(custom) || 20));
          const params = new URLSearchParams(query);
          params.set('limit', String(value));
          params.set('page', '1');
          router.push(`/tickets?${params.toString()}`);
        }}
      >
        <label className="sr-only" htmlFor="custom-page-size">
          Nombre d’éléments
        </label>
        <input
          id="custom-page-size"
          type="number"
          min={1}
          max={100}
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          className="h-8 w-16 rounded-md border bg-background px-2 text-center text-xs"
        />
        <Button type="submit" size="sm" variant="outline">
          Appliquer
        </Button>
      </form>
    </div>
  );
}

export function PaginationButton({
  enabled,
  href,
  label,
  children,
}: Readonly<{ enabled: boolean; href: LinkProps['href']; label: string; children: React.ReactNode }>) {
  if (!enabled)
    return (
      <Button type="button" variant="outline" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    );
  return (
    <Button nativeButton={false} variant="outline" size="icon" render={<Link href={href} aria-label={label} />}>
      {children}
    </Button>
  );
}

export function TicketListSkeleton() {
  return (
    <Panel className="space-y-3 p-4" role="status" aria-label="Chargement des tickets">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg bg-muted/50" />
      ))}
    </Panel>
  );
}
