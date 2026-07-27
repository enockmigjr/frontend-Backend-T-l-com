import { SlaPage } from '@/features/sla/sla-page';
import { AccessGate, isAdmin } from '@/features/users/components/access-gate';
export default function Page() {
  return (
    <AccessGate allow={isAdmin}>
      <SlaPage />
    </AccessGate>
  );
}
