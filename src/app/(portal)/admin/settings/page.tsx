import { SettingsPage } from '@/features/settings/settings-page';
import { AccessGate, isSupervisor } from '@/features/users/components/access-gate';
export default function Page() {
  return (
    <AccessGate allow={isSupervisor}>
      <SettingsPage />
    </AccessGate>
  );
}
