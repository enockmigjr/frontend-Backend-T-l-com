'use client';

import Link from 'next/link';
import { KeyRound, LogOut, Mail, MonitorX, ShieldCheck, UserRound } from 'lucide-react';
import type { CurrentUser } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useSessionActions } from '@/features/auth/use-session-actions';

export function AccountPanel({ user }: Readonly<{ user: CurrentUser }>) {
  const { logout, pending } = useSessionActions();
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
      <Card>
        <CardHeader>
          <CardTitle>Mon compte</CardTitle>
          <CardDescription>Informations fournies par votre profil d’entreprise.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Info icon={UserRound} label="Nom" value={`${user.firstName} ${user.lastName}`} />
          <Info icon={Mail} label="Adresse email" value={user.email} />
          <Info icon={ShieldCheck} label="Rôle" value={roleLabel(user.role)} />
          <Info icon={KeyRound} label="Identifiant" value={user.id.slice(0, 8)} mono />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
          <CardDescription>Gérez le mot de passe et les sessions actives.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/change-password?retour=/settings" />}
          >
            <KeyRound />Modifier mon mot de passe
          </Button>
          <Button variant="outline" disabled={pending} onClick={() => void logout(false)}><LogOut />Déconnecter cette session</Button>
          <ConfirmDialog
            trigger={<Button variant="destructive" disabled={pending}><MonitorX />Déconnecter toutes les sessions</Button>}
            title="Déconnecter toutes les sessions ?"
            description="Tous les appareils devront se reconnecter avec votre mot de passe."
            confirmLabel="Tout déconnecter"
            onConfirm={() => void logout(true)}
          />
        </CardContent>
      </Card>
    </div>
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
