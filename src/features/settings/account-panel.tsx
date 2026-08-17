'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Building2, CalendarClock, KeyRound, LogOut, Mail, MonitorX, Pause, Play, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { CurrentUser } from '@/lib/auth/session';
import { apiRequest } from '@/features/auth/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useSessionActions } from '@/features/auth/use-session-actions';

const profileSchema = z
  .object({
    isAvailable: z.boolean().optional(),
    absenceEndsAt: z.string().nullable().optional(),
  })
  .passthrough();

export function AccountPanel({ user }: Readonly<{ user: CurrentUser }>) {
  const { logout, pending } = useSessionActions();
  const client = useQueryClient();
  const [absenceEnd, setAbsenceEnd] = useState('');
  const profile = useQuery({
    queryKey: ['my-profile'],
    queryFn: ({ signal }) => apiRequest('/api/v1/users/me', profileSchema, { signal }),
  });
  const availability = useMutation({
    mutationFn: (available: boolean) =>
      apiRequest('/api/v1/users/me/availability', profileSchema, { method: 'PATCH', body: JSON.stringify({ available }) }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['my-profile'] });
      toast.add({ title: 'Disponibilité mise à jour' });
    },
  });
  const absence = useMutation({
    mutationFn: (absenceEndsAt: string) =>
      apiRequest('/api/v1/users/me/absence', profileSchema, {
        method: 'PATCH',
        body: JSON.stringify({ absenceEndsAt: absenceEndsAt || null }),
      }),
    onSuccess: async () => {
      setAbsenceEnd('');
      await client.invalidateQueries({ queryKey: ['my-profile'] });
      toast.add({ title: 'Absence enregistrée' });
    },
  });
  const me = profile.data;
  const paused = me?.isAvailable === false;
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mon compte</CardTitle>
            <CardDescription>Informations fournies par votre profil d&apos;entreprise.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Info icon={UserRound} label="Nom" value={`${user.firstName} ${user.lastName}`} />
            <Info icon={Mail} label="Adresse email" value={user.email} />
            <Info icon={ShieldCheck} label="Rôle" value={roleLabel(user.role)} />
            <Info icon={Building2} label="Département" value={user.department?.name ?? 'Non renseigné'} />
            <Info
              icon={CalendarClock}
              label="Dernière connexion"
              value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fr-FR') : 'Non renseignée'}
            />
            <Info icon={KeyRound} label="Identifiant" value={user.id.slice(0, 8)} mono />
            {user.department?.description ? (
              <p className="rounded-lg border bg-background p-3 text-sm text-muted-foreground sm:col-span-2">
                {user.department.description}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>
              Le mot de passe et les sessions actives sont gérés par votre compte professionnel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" onClick={() => window.location.assign('/api/auth/keycloak/account')}>
              <KeyRound />Compte et sécurité
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => void logout(false)}><LogOut />Déconnecter cette session</Button>
            <ConfirmDialog
              trigger={<Button variant="destructive" disabled={pending}><MonitorX />Déconnecter toutes les sessions</Button>}
              title="Déconnecter toutes les sessions ?"
              description="La session SSO courante est terminée ; tous les autres appareils devront se reconnecter avec leur compte professionnel."
              confirmLabel="Tout déconnecter"
              onConfirm={() => void logout(true)}
            />
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Disponibilité et absence</CardTitle>
          <CardDescription>
            En pause, vous n&apos;êtes plus proposé aux nouvelles assignations. L&apos;absence prolongée (plus de 7 jours)
            doit être déclarée par un administrateur ou superviseur.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">{paused ? 'Vous êtes en pause' : 'Disponible pour assignation'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {paused
                ? 'Les nouveaux tickets ne vous seront pas attribués.'
                : 'Vous êtes éligible aux nouvelles assignations automatiques.'}
            </p>
            <Button
              className="mt-3"
              variant={paused ? 'default' : 'outline'}
              disabled={availability.isPending || profile.isLoading}
              onClick={() => availability.mutate(paused ? true : false)}
            >
              {paused ? <><Play />Reprendre</> : <><Pause />Marquer en pause</>}
            </Button>
          </div>
          <form
            className="rounded-lg border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (absenceEnd) absence.mutate(new Date(`${absenceEnd}T18:00:00`).toISOString());
              else absence.mutate('');
            }}
          >
            <p className="text-sm font-medium">Absence planifiée</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {me?.absenceEndsAt
                ? `Absence en cours jusqu'au ${new Date(me.absenceEndsAt).toLocaleDateString('fr-FR')}.`
                : 'Indiquez la date de fin pour déclarer une absence.'}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-xs text-muted-foreground">
                Fin d&apos;absence
                <Input type="date" value={absenceEnd} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setAbsenceEnd(event.target.value)} className="h-9 w-40" />
              </label>
              <Button type="submit" size="sm" className="h-9" disabled={absence.isPending}>
                {absenceEnd ? 'Enregistrer' : me?.absenceEndsAt ? 'Annuler l’absence' : 'Enregistrer'}
              </Button>
            </div>
            {absence.error ? (
              <p className="mt-2 text-xs text-destructive">
                {absence.error instanceof Error ? absence.error.message : "Impossible d'enregistrer l'absence."}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function Info({ icon: Icon, label, value, mono = false }: Readonly<{
  icon: typeof UserRound;
  label: string;
  value: string;
  mono?: boolean;
}>) {
  return (
    <div className="flex gap-3 rounded-lg bg-muted/60 p-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className={`truncate font-medium ${mono ? 'font-mono' : ''}`}>{value}</p></div>
    </div>
  );
}

function roleLabel(role: CurrentUser['role']): string {
  return {
    ADMINISTRATOR: 'Administrateur',
    SUPERVISOR: 'Superviseur',
    CUSTOMER_SERVICE_AGENT: 'Service client',
    NOC_ENGINEER: 'Agent NOC',
    BILLING_AGENT: 'Facturation',
    TECHNICAL_SUPPORT_ENGINEER: 'Support technique',
    FIELD_TECHNICIAN: 'Technicien terrain',
  }[role];
}
