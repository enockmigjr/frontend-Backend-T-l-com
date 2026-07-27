import { Suspense } from 'react';
import { AuthShell } from '@/features/auth/auth-shell';
import { ChangePasswordForm } from '@/features/auth/change-password-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChangePasswordPage() {
  return (
    <AuthShell
      eyebrow="Sécurité du compte"
      title="Protégez votre accès"
      description="Choisissez un mot de passe robuste. Cette étape peut être imposée lors de votre première connexion."
    >
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><ChangePasswordForm /></Suspense>
    </AuthShell>
  );
}
