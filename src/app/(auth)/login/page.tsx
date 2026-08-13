import { redirect } from 'next/navigation';

import { isKeycloakAuth } from '@/lib/auth/keycloak';

export default function LoginPage() {
  // Keycloak est le seul fournisseur d'authentification : le formulaire local
  // a été supprimé. Sans session valide, l'utilisateur est envoyé vers le SSO.
  if (!isKeycloakAuth()) {
    return (
      <main className="grid min-h-dvh place-items-center bg-muted/30 p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Connexion SSO indisponible</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            L&apos;authentification est gérée par Keycloak. Vérifiez la configuration puis réessayez.
          </p>
        </div>
      </main>
    );
  }
  redirect('/api/auth/keycloak/login');
}
