import { DeliveriesPage } from '@/features/external-deliveries/deliveries-page';
import { AccessGate, isSupervisor } from '@/features/users/components/access-gate';

export default function Page() {
  return (
    <AccessGate allow={isSupervisor}>
      <DeliveriesPage />
    </AccessGate>
  );
}
