export function AdminSection({
  title,
  description,
  eyebrow = 'Administration',
  action,
  children,
}: Readonly<{
  title: string;
  description: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}>) {
  const headingId = `heading-${title.replaceAll(' ', '-').toLowerCase()}`;
  return (
    <section className="space-y-6" aria-labelledby={headingId}>
      <header className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
          <h1 id={headingId} className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
