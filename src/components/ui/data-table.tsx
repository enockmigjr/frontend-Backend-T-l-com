import type { ReactNode } from 'react';

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
}: {
  readonly rows: readonly T[];
  readonly columns: readonly DataColumn<T>[];
  readonly getRowKey: (row: T) => string;
  readonly caption: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`border-b border-slate-200 px-4 py-3 font-semibold ${column.className ?? ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="hover:bg-blue-50/40">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-top ${column.className ?? ''}`}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
