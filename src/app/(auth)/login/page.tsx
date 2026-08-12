import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/features/auth/auth-shell';
import { LoginForm } from '@/features/auth/login-form';
import { Skeleton } from '@/components/ui/skeleton';
import { isKeycloakAuth } from '@/lib/auth/keycloak';

export default function LoginPage() {
  if (isKeycloakAuth()) redirect('/api/auth/keycloak/login');
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
