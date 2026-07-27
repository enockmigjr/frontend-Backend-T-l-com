import { DashboardPage } from '@/features/dashboard/components/dashboard-page';
import { AccessGate, isSupervisor } from '@/features/users/components/access-gate';

export default function Page() {
  return (
    <AccessGate allow={isSupervisor}>
      <DashboardPage />
    </AccessGate>
  );
}
