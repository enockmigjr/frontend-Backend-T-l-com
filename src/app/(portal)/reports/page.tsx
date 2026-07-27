import { ReportsPage } from '@/features/reports/reports-page';
import { AccessGate, isSupervisor } from '@/features/users/components/access-gate';
export default function Page() {
  return (
    <AccessGate allow={isSupervisor}>
      <ReportsPage />
    </AccessGate>
  );
}
