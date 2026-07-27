import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  critical,
  complete,
}: Readonly<{ value: number; critical: boolean; complete: boolean }>) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(value)}>
      <div
        className={cn(
          'h-full rounded-full transition-[width]',
          complete ? 'bg-emerald-500' : critical ? 'bg-red-500' : 'bg-primary',
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
