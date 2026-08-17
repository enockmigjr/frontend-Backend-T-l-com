import { redirect } from 'next/navigation';

/**
 * Keycloak est l'unique fournisseur d'authentification : cette page envoie
 * immédiatement vers le flux OIDC du BFF (Authorization Code + PKCE).
 */
export default function LoginPage() {
  redirect('/api/auth/keycloak/login');
}
