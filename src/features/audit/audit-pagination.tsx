'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AuditPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: Readonly<{
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}>) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total} événement{total > 1 ? 's' : ''} · page {page} sur {Math.max(totalPages, 1)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Par page
          <select
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-9 rounded-lg border bg-background px-2 text-foreground"
          >
            {[10, 20, 50, 100].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft />Précédent
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Suivant<ChevronRight />
        </Button>
      </div>
    </div>
  );
}
