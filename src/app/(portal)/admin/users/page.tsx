import { UsersPage } from '@/features/users/components/users-page';
import { AccessGate, isSupervisor } from '@/features/users/components/access-gate';
export default function Page() {
  return (
    <AccessGate allow={isSupervisor}>
      <UsersPage />
    </AccessGate>
  );
}
