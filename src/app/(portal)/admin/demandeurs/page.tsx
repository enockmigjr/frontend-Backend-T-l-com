import { RequestersPage } from '@/features/external-requesters/requesters-page';
import { AccessGate, isSupervisor } from '@/features/users/components/access-gate';

export default function Page() {
  return (
    <AccessGate allow={isSupervisor}>
      <RequestersPage />
    </AccessGate>
  );
}
