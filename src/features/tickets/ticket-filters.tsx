'use client';

import { Search } from 'lucide-react';

export function TicketFilters({ values }: Readonly<{ values: Readonly<Record<string, string>> }>) {
  return (
    <form
      method="GET"
      className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
      role="search"
    >
      <div>
        <label className="sr-only" htmlFor="ticket-search">
          Rechercher un ticket
        </label>
        <input
          id="ticket-search"
          name="search"
          defaultValue={values.search}
          placeholder="Numéro, titre ou description"
          className="min-h-11 w-full rounded-lg border px-3 py-2"
        />
      </div>
      <div>
        <label className="sr-only" htmlFor="ticket-status">
          Statut
        </label>
        <select
          id="ticket-status"
          name="status"
          defaultValue={values.status}
          className="min-h-11 w-full rounded-lg border px-3 py-2"
        >
          <option value="">Tous les statuts</option>
          <option value="NEW">Nouveau</option>
          <option value="ASSIGNED">Assigné</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="PENDING_CUSTOMER">Attente client</option>
          <option value="PENDING_THIRD_PARTY">Attente tiers</option>
          <option value="RESOLVED">Résolu</option>
          <option value="CLOSED">Clôturé</option>
        </select>
      </div>
      <div>
        <label className="sr-only" htmlFor="ticket-priority">
          Priorité
        </label>
        <select
          id="ticket-priority"
          name="priority"
          defaultValue={values.priority}
          className="min-h-11 w-full rounded-lg border px-3 py-2"
        >
          <option value="">Toutes les priorités</option>
          <option value="CRITICAL">Critique</option>
          <option value="HIGH">Haute</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="LOW">Basse</option>
        </select>
      </div>
      <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
        <Search aria-hidden size={18} />
        Filtrer
      </button>
    </form>
  );
}
