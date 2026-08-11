import { IntegrationsPage } from '@/features/support-integrations/integrations-page';
import { AccessGate, isSupervisor } from '@/features/users/components/access-gate';

export default function Page() {
  return (
    <AccessGate allow={isSupervisor}>
      <IntegrationsPage />
    </AccessGate>
  );
}
