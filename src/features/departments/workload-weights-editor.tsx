'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const severities = ['S1', 'S2', 'S3', 'S4'] as const;
const priorityLabels: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

function toFields(values?: Readonly<Record<string, number>>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(values ?? {})) {
    if (typeof values?.[key] === 'number') result[key] = String(values[key]);
  }
  return result;
}

function filled(fields: Readonly<Record<string, string>>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(fields)) {
    const value = Number(raw);
    if (raw.trim() !== '' && Number.isFinite(value) && value > 0) result[key] = value;
  }
  return result;
}

/**
 * Pondération de charge par priorité et sévérité : champs numériques simples,
 * sans JSON ni saisie clé/valeur. Sérialise dans le FormData sous `name`.
 */
export function WorkloadWeightsEditor({
  name,
  label,
  initial,
}: Readonly<{
  name: string;
  label: string;
  initial?: Readonly<{ priority?: Record<string, number>; severity?: Record<string, number> }>;
}>) {
  const [priority, setPriority] = useState<Record<string, string>>(() => toFields(initial?.priority));
  const [severity, setSeverity] = useState<Record<string, string>>(() => toFields(initial?.severity));

  const priorityFilled = filled(priority);
  const severityFilled = filled(severity);
  const serialized = JSON.stringify({
    ...(Object.keys(priorityFilled).length > 0 ? { priority: priorityFilled } : {}),
    ...(Object.keys(severityFilled).length > 0 ? { severity: severityFilled } : {}),
  });

  return (
    <div className="grid gap-3">
      <span className="text-sm font-medium">{label}</span>
      <p className="text-xs text-muted-foreground">
        Poids appliqués au calcul de charge : laissez vide pour ne pas pondérer.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="grid gap-2 rounded-lg border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">Par priorité</legend>
          {priorities.map((value) => (
            <label key={value} className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-2 text-sm">
              <span>{priorityLabels[value]}</span>
              <Input
                type="number"
                min={0}
                step={1}
                className="h-9"
                placeholder="—"
                value={priority[value] ?? ''}
                onChange={(event) => setPriority((current) => ({ ...current, [value]: event.target.value }))}
              />
            </label>
          ))}
        </fieldset>
        <fieldset className="grid gap-2 rounded-lg border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">Par sévérité</legend>
          {severities.map((value) => (
            <label key={value} className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-2 text-sm">
              <span>{value}</span>
              <Input
                type="number"
                min={0}
                step={1}
                className="h-9"
                placeholder="—"
                value={severity[value] ?? ''}
                onChange={(event) => setSeverity((current) => ({ ...current, [value]: event.target.value }))}
              />
            </label>
          ))}
        </fieldset>
      </div>
      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}
