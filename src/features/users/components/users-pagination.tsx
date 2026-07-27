import { Button } from '@/components/ui/button';

export function UsersPagination({
  page,
  totalPages,
  limit,
  onPage,
  onLimit,
}: Readonly<{
  page: number;
  totalPages: number;
  limit: number;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
}>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <label className="flex items-center gap-2 text-muted-foreground">
        Lignes par page
        <select
          value={limit}
          onChange={(event) => onLimit(Number(event.target.value))}
          className="h-8 rounded-lg border bg-background px-2 text-foreground"
        >
          {[10, 20, 50, 100].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Précédent
        </Button>
        <span>
          Page {page} sur {totalPages}
        </span>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Suivant
        </Button>
      </div>
    </div>
  );
}
