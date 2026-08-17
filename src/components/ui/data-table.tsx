'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from './button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './table';

type SortValue = string | number | Date | null | undefined;

export interface DataColumn<T> {
  readonly key: string;
  readonly label: string;
  readonly cell: (row: T) => ReactNode;
  readonly className?: string;
  readonly sortValue?: (row: T) => SortValue;
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
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>();
  const sortedRows = useMemo(() => sortRows(rows, columns, sort), [columns, rows, sort]);

  function changeSort(key: string) {
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader className="bg-muted/55">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.sortValue ? (
                  <Button variant="ghost" size="sm" className="-ml-2" onClick={() => changeSort(column.key)}>
                    {column.label}
                    {sort?.key !== column.key ? (
                      <ArrowUpDown />
                    ) : sort.direction === 'asc' ? (
                      <ArrowUp />
                    ) : (
                      <ArrowDown />
                    )}
                  </Button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => (
            <TableRow key={getRowKey(row)} className="group hover:bg-primary/5 dark:hover:bg-primary/10">
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

function sortRows<T>(
  rows: readonly T[],
  columns: readonly DataColumn<T>[],
  sort?: { key: string; direction: 'asc' | 'desc' },
): readonly T[] {
  if (!sort) return rows;
  const getter = columns.find((column) => column.key === sort.key)?.sortValue;
  if (!getter) return rows;
  return [...rows].sort((left, right) => {
    const a = comparable(getter(left));
    const b = comparable(getter(right));
    const result = a < b ? -1 : a > b ? 1 : 0;
    return sort.direction === 'asc' ? result : -result;
  });
}

function comparable(value: SortValue): string | number {
  if (value instanceof Date) return value.getTime();
  return typeof value === 'string' ? value.toLocaleLowerCase('fr') : (value ?? '');
}
