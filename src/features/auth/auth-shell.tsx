import { Activity, Clock3, RadioTower, ShieldCheck } from 'lucide-react';

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <main id="contenu" className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.35),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(13,148,136,0.22),transparent_35%)]" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/40"><RadioTower /></span>
          <div><strong className="block tracking-wide">KAMGOKO</strong><span className="text-sm text-slate-400">Telecom Operations Desk</span></div>
        </div>
        <div className="relative max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">Centre de contrôle</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight">Chaque incident visible. Chaque équipe alignée.</h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">Accédez aux tickets, engagements SLA et opérations critiques depuis une console sécurisée.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Feature icon={Activity} label="Suivi temps réel" />
            <Feature icon={Clock3} label="Pilotage SLA" />
            <Feature icon={ShieldCheck} label="Accès sécurisé" />
          </div>
        </div>
        <p className="relative text-xs text-slate-500">Accès réservé aux équipes autorisées · Activité auditée</p>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-700 text-white"><RadioTower className="size-5" /></span>
            <div><strong className="block">KAMGOKO</strong><span className="text-xs text-muted-foreground">Operations Desk</span></div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-7 mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}

function Feature({ icon: Icon, label }: Readonly<{ icon: typeof Activity; label: string }>) {
  return <div className="rounded-xl border border-white/10 bg-white/5 p-3"><Icon className="mb-2 size-5 text-blue-300" /><span className="text-sm text-slate-200">{label}</span></div>;
}
