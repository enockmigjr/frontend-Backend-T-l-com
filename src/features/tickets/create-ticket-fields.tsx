import { type LucideIcon } from 'lucide-react';

export const priorities = [
  ['LOW', 'Basse'],
  ['MEDIUM', 'Moyenne'],
  ['HIGH', 'Haute'],
  ['CRITICAL', 'Critique'],
] as const;

export const severities = [
  ['S1', 'S1 — Impact critique'],
  ['S2', 'S2 — Impact majeur'],
  ['S3', 'S3 — Impact modéré'],
  ['S4', 'S4 — Impact faible'],
] as const;

export const selectClass =
  'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

export function SectionHeader({
  icon: Icon,
  title,
  description,
}: Readonly<{ icon: LucideIcon; title: string; description: string }>) {
  return (
    <div className="flex gap-3 border-b bg-muted/20 px-5 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function FormField({
  label,
  error,
  className,
  children,
}: Readonly<{ label: string; error?: string; className?: string; children: React.ReactNode }>) {
  return (
    <label className={`grid gap-1.5 text-sm font-medium ${className ?? ''}`}>
      {label}
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  error,
  children,
}: Readonly<{ label: string; error?: string; children: React.ReactNode }>) {
  return (
    <FormField label={label} error={error}>
      {children}
    </FormField>
  );
}

export function Summary({ label, value }: Readonly<{ label: string; value?: string }>) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || 'À sélectionner'}</dd>
    </div>
  );
}
