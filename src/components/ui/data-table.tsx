import type { ReactNode } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './table';

export interface DataColumn<T> {
  readonly key: string;
  readonly label: string;
  readonly cell: (row: T) => ReactNode;
  readonly className?: string;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  caption,
}: Readonly<{
  rows: readonly T[];
  columns: readonly DataColumn<T>[];
  getRowKey: (row: T) => string;
  caption: string;
}>) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader className="bg-muted/55">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowKey(row)} className="group hover:bg-blue-50/45">
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
