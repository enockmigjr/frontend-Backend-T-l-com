'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, KeyRound, ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResourceDialog } from '@/components/ui/resource-dialog';
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/features/tickets/presentation';
import { listCredentials, listDevices, revokeCredential, revokeDevice, rotateIntegrationSecret } from './api';
import type { SupportIntegration } from './types';

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function StatusBadge({ status }: { readonly status: string }) {
  const tone =
    status === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-900'
      : status === 'SUSPENDED'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-slate-200 text-slate-800';
  return <Badge className={tone}>{status === 'ACTIVE' ? 'Active' : status === 'SUSPENDED' ? 'Suspendue' : 'Brouillon'}</Badge>;
}

function JsonBlock({ label, value }: { readonly label: string; readonly value: unknown }) {
  const text = value && Object.keys(value as Record<string, unknown>).length > 0 ? JSON.stringify(value, null, 2) : 'Aucune politique définie.';
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <pre className="overflow-x-auto rounded-lg border bg-slate-50 p-3 text-xs leading-5">{text}</pre>
    </div>
  );
}

export function IntegrationDetail(
  props: Readonly<{
    integration: SupportIntegration;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canWrite: boolean;
  }>,
) {
  const { integration } = props;
  const trustDays = typeof integration.trustPolicy?.trustedDeviceDays === 'number' ? integration.trustPolicy.trustedDeviceDays : 90;
  const [secret, setSecret] = useState('');
  const credentials = useQuery({
    queryKey: ['integration-credentials', integration.id],
    queryFn: ({ signal }) => listCredentials(integration.id, signal).then((result) => result.data),
    enabled: props.open,
  });
  const devices = useQuery({
    queryKey: ['integration-devices', integration.id],
    queryFn: ({ signal }) => listDevices(integration.id, 1, 25, signal).then((result) => result.data),
    enabled: props.open,
  });
  const rotate = useMutation({
    mutationFn: () => rotateIntegrationSecret(integration.id, secret),
    onSuccess: (result) => {
      const until = result.data.previousValidUntil ? formatDate(result.data.previousValidUntil.toISOString()) : 'la fin de la période de grâce';
      toast.add({ title: 'Secret pivoté', description: `Version ${result.data.version} active, l’ancienne reste valable jusqu’à ${until}.`, type: 'success' });
      setSecret('');
      void credentials.refetch();
    },
  });
  const revokeCred = useMutation({
    mutationFn: (credentialId: string) => revokeCredential(integration.id, credentialId),
    onSuccess: () => {
      toast.add({ title: 'Version de secret révoquée', type: 'success' });
      void credentials.refetch();
    },
  });
  const revokeDev = useMutation({
    mutationFn: (deviceId: string) => revokeDevice(integration.id, deviceId),
    onSuccess: () => {
      toast.add({ title: 'Appareil de confiance révoqué', type: 'success' });
      void devices.refetch();
    },
  });

  return (
    <ResourceDialog open={props.open} onOpenChange={props.onOpenChange} title={integration.name} description={`Clé publique : ${integration.publicKey}`} size="wide">
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Statut</p>
            <div className="mt-2"><StatusBadge status={integration.status} /></div>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Confiance appareil</p>
            <p className="mt-2 text-sm font-medium">{trustDays} jours renouvelables</p>
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Origines autorisées</p>
          <ul className="flex flex-wrap gap-2">
            {integration.allowedOrigins.length > 0 ? (
              integration.allowedOrigins.map((origin) => (
                <li key={origin} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium">{origin}</li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">Aucune origine.</li>
            )}
          </ul>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <JsonBlock label="Routage" value={integration.routingPolicy} />
          <JsonBlock label="Quotas" value={integration.quotaPolicy} />
        </div>
        {integration.appearance && Object.keys(integration.appearance).length > 0 ? (
          <JsonBlock label="Apparence" value={integration.appearance} />
        ) : null}
        <div className="rounded-xl border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Versions de secret</p>
          {credentials.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (credentials.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune version enregistrée.</p>
          ) : (
            <ul className="space-y-2">
              {(credentials.data ?? []).map((credential) => (
                <li key={credential.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium">Version {credential.version}</span>
                  <span className="text-xs text-muted-foreground">Active depuis {credential.activeFrom ? formatDate(credential.activeFrom.toISOString()) : '—'}</span>
                  {credential.revokedAt ? (
                    <Badge className="bg-amber-100 text-amber-900">Révoquée</Badge>
                  ) : props.canWrite ? (
                    <Button variant="outline" size="sm" disabled={revokeCred.isPending} onClick={() => revokeCred.mutate(credential.id)}>
                      <ShieldOff className="size-3.5" />Révoquer
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        {props.canWrite ? (
          <div className="rounded-xl border p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rotation du secret</p>
            <p className="mb-3 text-sm text-muted-foreground">Générez un secret puis faites pivoter : la version précédente reste valable pendant la période de grâce. Le secret ne sera jamais affiché ensuite.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={secret} placeholder="Secret base64url (43 caractères)" className="font-mono" />
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={!secret} onClick={() => void navigator.clipboard.writeText(secret).then(() => toast.add({ title: 'Secret copié', type: 'success' }))}>
                  <Copy className="size-4" />Copier
                </Button>
                <Button type="button" disabled={!secret || rotate.isPending} onClick={() => rotate.mutate()}>
                  <KeyRound className="size-4" />{rotate.isPending ? 'Rotation…' : 'Faire pivoter'}
                </Button>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setSecret(generateSecret())}>Générer un secret aléatoire</Button>
          </div>
        ) : null}
        <div className="rounded-xl border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Appareils de confiance ({devices.data?.length ?? 0})</p>
          {devices.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (devices.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun appareil.</p>
          ) : (
            <ul className="space-y-2">
              {(devices.data ?? []).map((device) => (
                <li key={device.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-mono text-xs">{device.id.slice(0, 8)}…</span>
                  <span className="text-xs text-muted-foreground">Expire le {device.expiresAt ? formatDate(device.expiresAt.toISOString()) : '—'}</span>
                  {device.revokedAt ? (
                    <Badge className="bg-amber-100 text-amber-900">Révoqué</Badge>
                  ) : props.canWrite ? (
                    <Button variant="outline" size="sm" disabled={revokeDev.isPending} onClick={() => revokeDev.mutate(device.id)}>
                      <ShieldOff className="size-3.5" />Révoquer
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ResourceDialog>
  );
}
