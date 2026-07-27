import { DepartmentsPage } from '@/features/departments/departments-page';
import { AccessGate, isAdmin } from '@/features/users/components/access-gate';
export default function Page() {
  return (
    <AccessGate allow={isAdmin}>
      <DepartmentsPage />
    </AccessGate>
  );
}
