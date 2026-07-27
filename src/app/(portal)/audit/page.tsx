import { AuditPage } from '@/features/audit/audit-page';
import { AccessGate, isSupervisor } from '@/features/users/components/access-gate';
export default function Page() {
  return (
    <AccessGate allow={isSupervisor}>
      <AuditPage />
    </AccessGate>
  );
}
