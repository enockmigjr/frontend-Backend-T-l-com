export function AdminSection({
  title,
  description,
  action,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="space-y-5" aria-labelledby={`heading-${title.replaceAll(' ', '-').toLowerCase()}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            id={`heading-${title.replaceAll(' ', '-').toLowerCase()}`}
            className="text-2xl font-semibold text-zinc-950"
          >
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-zinc-600">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
