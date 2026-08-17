'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GitMerge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/features/tickets/presentation';
import { listRequesters, mergePreview, mergeRequesters } from './api';
import type { ExternalRequesterDetail, MergePreview } from './types';

function StatCard({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

const IDENTITY_LABELS: Record<string, string> = {
  EMAIL: 'Adresse email',
  PHONE: 'Téléphone',
  WORDPRESS: 'Compte WordPress',
};

export function RequesterDetail(
  props: Readonly<{
    requester: ExternalRequesterDetail;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canWrite: boolean;
    onMerged: () => void;
  }>,
) {
  const { requester } = props;
  return (
    <ResourceDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={requester.displayName ?? 'Demandeur anonyme'}
      description="Profil public conservé côté serveur, sans compte interne ni valeur de contact en clair."
      size="large"
    >
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Tickets" value={requester.summary.tickets} />
          <StatCard label="Conversations" value={requester.summary.conversations} />
          <StatCard label="Appareils de confiance" value={requester.summary.trustedDevices} />
        </div>
        <div className="rounded-xl border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Identités vérifiées
          </p>
          {requester.summary.identities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune identité enregistrée.</p>
          ) : (
            <ul className="space-y-2">
              {requester.summary.identities.map((identity) => (
                <li
                  key={`${identity.identityType}-${identity.verifiedAt.toISOString()}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{IDENTITY_LABELS[identity.identityType] ?? identity.identityType}</span>
                  <span className="text-xs text-muted-foreground">
                    Vérifiée le {formatDate(identity.verifiedAt.toISOString())}
                  </span>
                  {identity.revokedAt ? (
                    <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                      Révoquée
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
                      Active
                    </Badge>
                  )}
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
            <p className="mt-2 text-sm">
              {requester.lastSeenAt ? formatDate(requester.lastSeenAt.toISOString()) : '—'}
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profil</p>
            <p className="mt-2 text-sm">
              {requester.anonymizedAt ? `Anonymisé le ${formatDate(requester.anonymizedAt.toISOString())}` : 'Actif'}
            </p>
          </div>
        </div>
        {props.canWrite ? <MergeSection requester={requester} onMerged={props.onMerged} /> : null}
      </div>
    </ResourceDialog>
  );
}

function MergeSection({
  requester,
  onMerged,
}: {
  readonly requester: ExternalRequesterDetail;
  readonly onMerged: () => void;
}) {
  const [targetId, setTargetId] = useState('');
  const [preview, setPreview] = useState<MergePreview>();
  const [confirming, setConfirming] = useState(false);
  const candidates = useQuery({
    queryKey: ['external-requesters', requester.supportIntegrationId],
    queryFn: ({ signal }) =>
      listRequesters({ supportIntegrationId: requester.supportIntegrationId }, 1, 100, signal).then(
        (result) => result.data,
      ),
  });
  const available = (candidates.data ?? []).filter((item) => item.id !== requester.id && !item.anonymizedAt);
  const previewMutation = useMutation({
    mutationFn: () => mergePreview(requester.id),
    onSuccess: (result) => setPreview(result.data),
  });
  const mergeMutation = useMutation({
    mutationFn: () => mergeRequesters(requester.id, targetId),
    onSuccess: (result) => {
      toast.add({
        title: 'Profils fusionnés',
        description: `${result.data.identityCollisionsRemoved} identité(s) en doublon supprimée(s).`,
        type: 'success',
      });
      onMerged();
    },
  });
  const moved = preview?.moved;
  const totalMoved = moved ? Object.values(moved).reduce((sum, value) => sum + value, 0) : 0;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <GitMerge className="size-4" />
        Fusion de profils
      </p>
      <p className="mb-3 text-sm text-muted-foreground">
        Rattache toutes les références de ce profil à un autre demandeur de la même intégration. L’historique d’audit
        reste immuable.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={targetId}
          onChange={(event) => {
            setTargetId(event.target.value);
            setPreview(undefined);
          }}
          className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm"
        >
          <option value="">Choisir le profil cible…</option>
          {available.map((item) => (
            <option key={item.id} value={item.id}>
              {item.displayName ?? 'Demandeur anonyme'} · {item.id.slice(0, 8)}…
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          disabled={!targetId || previewMutation.isPending}
          onClick={() => previewMutation.mutate()}
        >
          {previewMutation.isPending ? 'Analyse…' : 'Prévisualiser'}
        </Button>
        <Button
          type="button"
          disabled={!preview || !targetId || mergeMutation.isPending}
          onClick={() => setConfirming(true)}
        >
          {mergeMutation.isPending ? 'Fusion…' : 'Fusionner'}
        </Button>
      </div>
      {preview ? (
        <div className="mt-4 rounded-lg border bg-card p-4">
          <p className="mb-2 text-sm font-semibold">Impacts (références à rattacher)</p>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {Object.entries(preview.moved).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="capitalize text-muted-foreground">{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Total : {totalMoved} référence(s). {preview.kept.auditEntries} entrée(s) d’audit et{' '}
            {preview.kept.idempotencyRecords} enregistrement(s) d’idempotence restent sur le profil source (historique
            immuable).
          </p>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirming}
        title="Fusionner ces profils demandeur ?"
        description="Cette action est irréversible : toutes les références du profil source seront rattachées au profil cible, avec une trace d’audit."
        confirmLabel="Fusionner"
        onConfirm={() => mergeMutation.mutate()}
        onOpenChange={(open) => {
          if (!open) setConfirming(false);
        }}
      />
    </div>
  );
}
