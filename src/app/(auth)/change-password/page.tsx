import { ChangePasswordForm } from '@/features/auth/change-password-form';

export default function ChangePasswordPage() {
  return (
    <main id="contenu" tabIndex={-1} className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm" aria-labelledby="password-title">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700">Sécurité du compte</p>
        <h1 id="password-title" className="text-2xl font-bold">
          Changez votre mot de passe
        </h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">Cette étape est obligatoire avant d’accéder au portail.</p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
