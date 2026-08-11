'use client';

import { Badge } from '@/components/ui/badge';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { formatDate } from '@/features/tickets/presentation';
import type { ExternalRequesterDetail } from './types';

function StatCard({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

const IDENTITY_LABELS: Record<string, string> = { EMAIL: 'Adresse email', PHONE: 'Téléphone', WORDPRESS: 'Compte WordPress' };

export function RequesterDetail({ requester, open, onOpenChange }: { readonly requester: ExternalRequesterDetail; readonly open: boolean; readonly onOpenChange: (open: boolean) => void }) {
  return (
    <ResourceDialog open={open} onOpenChange={onOpenChange} title={requester.displayName ?? 'Demandeur anonyme'} description="Profil public conservé côté serveur, sans compte interne ni valeur de contact en clair." size="large">
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Tickets" value={requester.summary.tickets} />
          <StatCard label="Conversations" value={requester.summary.conversations} />
          <StatCard label="Appareils de confiance" value={requester.summary.trustedDevices} />
        </div>
        <div className="rounded-xl border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Identités vérifiées</p>
          {requester.summary.identities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune identité enregistrée.</p>
          ) : (
            <ul className="space-y-2">
              {requester.summary.identities.map((identity) => (
                <li key={`${identity.identityType}-${identity.verifiedAt.toISOString()}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium">{IDENTITY_LABELS[identity.identityType] ?? identity.identityType}</span>
                  <span className="text-xs text-muted-foreground">Vérifiée le {formatDate(identity.verifiedAt.toISOString())}</span>
                  {identity.revokedAt ? <Badge className="bg-amber-100 text-amber-900">Révoquée</Badge> : <Badge className="bg-emerald-100 text-emerald-900">Active</Badge>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Langue</p>
            <p className="mt-2 text-sm font-medium">{requester.locale}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dernière activité</p>
            <p className="mt-2 text-sm">{requester.lastSeenAt ? formatDate(requester.lastSeenAt.toISOString()) : '—'}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profil</p>
            <p className="mt-2 text-sm">{requester.anonymizedAt ? `Anonymisé le ${formatDate(requester.anonymizedAt.toISOString())}` : 'Actif'}</p>
          </div>
        </div>
      </div>
    </ResourceDialog>
  );
}
