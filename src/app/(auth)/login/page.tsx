import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <main id="contenu" tabIndex={-1} className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm" aria-labelledby="login-title">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700">Portail incidents télécom</p>
        <h1 id="login-title" className="text-2xl font-bold text-slate-950">
          Connexion
        </h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">Accédez à votre espace opérationnel sécurisé.</p>
        <LoginForm />
      </section>
    </main>
  );
}
