import { AlertTriangle, CircleCheck, CircleDot, Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { priorityLabels, statusLabels } from './presentation';
import type { TicketStatus } from './schemas';

const statusStyles: Record<TicketStatus, string> = {
  NEW: 'border-blue-200 bg-blue-50 text-blue-700',
  ASSIGNED: 'border-violet-200 bg-violet-50 text-violet-700',
  IN_PROGRESS: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  PENDING_CUSTOMER: 'border-amber-200 bg-amber-50 text-amber-800',
  PENDING_THIRD_PARTY: 'border-orange-200 bg-orange-50 text-orange-800',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
  REOPENED: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
};

const priorityStyles = {
  LOW: 'border-slate-200 bg-slate-50 text-slate-600',
  MEDIUM: 'border-blue-200 bg-blue-50 text-blue-700',
  HIGH: 'border-amber-200 bg-amber-50 text-amber-800',
  CRITICAL: 'border-red-200 bg-red-50 text-red-700',
} as const;

export function TicketStatusBadge({ status }: Readonly<{ status: TicketStatus }>) {
  const Icon =
    status === 'CLOSED' || status === 'RESOLVED' ? CircleCheck : status.includes('PENDING') ? Clock3 : CircleDot;
  return (
    <Badge variant="outline" className={cn('h-6 gap-1.5 px-2.5', statusStyles[status])}>
      <Icon aria-hidden />
      {statusLabels[status]}
    </Badge>
  );
}

export function TicketPriorityBadge({ priority }: Readonly<{ priority: keyof typeof priorityLabels }>) {
  return (
    <Badge variant="outline" className={cn('h-6 px-2.5', priorityStyles[priority])}>
      {priority === 'CRITICAL' ? <AlertTriangle aria-hidden /> : null}
      {priorityLabels[priority]}
    </Badge>
  );
}
