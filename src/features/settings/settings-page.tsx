'use client';

import { Palette, ServerCog, UserRound } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { AdminSection } from '@/features/users/components/admin-section';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { ErrorState, LoadingState } from '@/features/users/components/async-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountPanel } from './account-panel';
import { PreferencePanel } from './preference-panel';
import { SystemSettingsPanel } from './system-settings-panel';

export function SettingsPage() {
  const user = useCurrentUser();
  const searchParams = useSearchParams();
  if (user.isPending) return <LoadingState label="Chargement de vos paramètres…" />;
  if (user.error || !user.data) return <ErrorState message="Impossible de charger votre profil." />;
  const elevated = user.data.role === 'ADMINISTRATOR' || user.data.role === 'SUPERVISOR';
  const requested = searchParams.get('tab');
  const initialTab = requested === 'system' && elevated ? 'system' : requested === 'interface' ? 'interface' : 'account';
  return (
    <AdminSection
      eyebrow="Espace personnel"
      title="Profil et paramètres"
      description="Gérez votre compte, adaptez l’interface à votre façon de travailler et consultez la configuration autorisée."
    >
      <Tabs defaultValue={initialTab}>
        <TabsList
          className={`grid h-auto w-full bg-transparent p-0 ${elevated ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}
          variant="line"
        >
          <TabsTrigger value="account" className="min-h-10 min-w-0 px-3"><UserRound />Mon compte</TabsTrigger>
          <TabsTrigger value="interface" className="min-h-10 min-w-0 px-3"><Palette />Interface</TabsTrigger>
          {elevated ? <TabsTrigger value="system" className="min-h-10 min-w-0 px-3"><ServerCog /><span className="truncate">Configuration système</span></TabsTrigger> : null}
        </TabsList>
        <TabsContent value="account" className="pt-5"><AccountPanel user={user.data} /></TabsContent>
        <TabsContent value="interface" className="pt-5"><PreferencePanel /></TabsContent>
        {elevated ? <TabsContent value="system" className="pt-5"><SystemSettingsPanel canEdit={user.data.role === 'ADMINISTRATOR'} /></TabsContent> : null}
      </Tabs>
    </AdminSection>
  );
}
