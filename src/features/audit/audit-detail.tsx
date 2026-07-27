export function AuditBlock({ title, value }: Readonly<{ title: string; value: unknown }>) {
  return (
    <section className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <AuditValue value={value} />
    </section>
  );
}

function AuditValue({ value }: Readonly<{ value: unknown }>) {
  if (value === null || value === undefined) return <p className="text-sm text-muted-foreground">Aucune valeur</p>;
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={index}><AuditValue value={item} /></li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') {
    return (
      <dl className="grid gap-2 text-sm">
        {Object.entries(value).map(([key, item]) => (
          <div key={key} className="grid gap-1 sm:grid-cols-[160px_1fr]">
            <dt className="font-medium text-muted-foreground">{key}</dt>
            <dd><AuditValue value={item} /></dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span className="break-words text-sm">{String(value)}</span>;
}
