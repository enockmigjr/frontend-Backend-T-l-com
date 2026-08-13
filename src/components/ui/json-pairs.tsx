'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Row = Readonly<{ key: string; value: string }>;

function parseValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function initialRows(record?: Readonly<Record<string, unknown>>): Row[] {
  if (!record) return [];
  return Object.entries(record).map(([key, value]) => ({ key, value: JSON.stringify(value) }));
}

/**
 * Éditeur structuré clé/valeur pour les politiques JSON (pondérations, routage,
 * quotas) : l'admin ne manipule jamais de JSON brut. Un champ caché sérialise
 * le résultat dans le FormData sous le nom fourni.
 */
export function JsonPairsEditor({
  name,
  label,
  initial,
}: Readonly<{
  name: string;
  label: string;
  initial?: Readonly<Record<string, unknown>>;
}>) {
  const [rows, setRows] = useState<Row[]>(() => initialRows(initial));
  const active = rows.filter((row) => row.key.trim().length > 0);
  const serialized =
    active.length > 0
      ? JSON.stringify(
          Object.fromEntries(active.map((row) => [row.key.trim(), parseValue(row.value)])),
        )
      : '';

  const update = (index: number, patch: Partial<Row>) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Aucune entrée. Ajoutez des clés et valeurs ci-dessous.
        </p>
      ) : (
        rows.map((row, index) => (
          <div key={`${index}-${row.key}`} className="flex items-center gap-2">
            <Input
              className="h-9 w-2/5 min-w-0"
              placeholder="Clé (ex. CRITICAL)"
              value={row.key}
              onChange={(event) => update(index, { key: event.target.value })}
            />
            <Input
              className="h-9 min-w-0 flex-1"
              placeholder="Valeur (nombre, texte ou JSON)"
              value={row.value}
              onChange={(event) => update(index, { value: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Retirer cette entrée"
              onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
            >
              <X aria-hidden className="size-4" />
            </Button>
          </div>
        ))
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRows((current) => [...current, { key: '', value: '' }])}
        >
          <Plus aria-hidden className="size-4" />
          Ajouter une entrée
        </Button>
      </div>
      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}

/** Vue lecture seule structurée (remplace l'affichage JSON brut). */
export function JsonPairsView({
  label,
  value,
}: Readonly<{ label: string; value?: Readonly<Record<string, unknown>> }>) {
  const entries = value && Object.keys(value).length > 0 ? Object.entries(value) : [];
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      {entries.length === 0 ? (
        <p className="rounded-lg border bg-slate-50 p-3 text-xs text-muted-foreground">
          Aucune politique définie.
        </p>
      ) : (
        <dl className="divide-y overflow-hidden rounded-lg border">
          {entries.map(([key, entry]) => (
            <div
              key={key}
              className="grid gap-1 bg-card px-3 py-2 text-xs sm:grid-cols-[minmax(0,40%)_minmax(0,1fr)]"
            >
              <dt className="font-medium text-muted-foreground">{key}</dt>
              <dd className="min-w-0 break-words">
                {typeof entry === 'object' && entry !== null ? JSON.stringify(entry) : String(entry)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
