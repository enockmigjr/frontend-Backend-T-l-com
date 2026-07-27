import { CategoriesPage } from '@/features/categories/categories-page';
import { AccessGate, isAdmin } from '@/features/users/components/access-gate';
export default function Page() {
  return (
    <AccessGate allow={isAdmin}>
      <CategoriesPage />
    </AccessGate>
  );
}
