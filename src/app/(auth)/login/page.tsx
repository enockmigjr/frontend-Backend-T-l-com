import { Suspense } from 'react';
import { AuthShell } from '@/features/auth/auth-shell';
import { LoginForm } from '@/features/auth/login-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Portail incidents télécom"
      title="Bienvenue"
      description="Connectez-vous avec votre compte professionnel pour reprendre vos opérations."
    >
      <Suspense fallback={<Skeleton className="h-80 w-full" />}><LoginForm /></Suspense>
    </AuthShell>
  );
}
