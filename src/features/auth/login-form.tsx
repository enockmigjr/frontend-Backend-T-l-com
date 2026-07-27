'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { useForm } from 'react-hook-form';
import { login } from './api';
import { ErrorAlert } from './error-alert';
import { loginSchema, type LoginInput } from './schemas';

const subscribeToHydration = () => () => undefined;

export function authenticatedDestination(role: Awaited<ReturnType<typeof login>>['role']): string {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR' ? '/dashboard' : '/tickets';
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<unknown>();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function submit(values: LoginInput) {
    setError(undefined);
    try {
      const user = await login(values);
      router.replace(user.mustChangePassword ? '/change-password' : authenticatedDestination(user.role));
      router.refresh();
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
      {error ? <ErrorAlert error={error} /> : null}
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
          Adresse email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="min-h-11 w-full rounded-lg border px-3 py-2.5"
          {...register('email')}
        />
        {errors.email ? (
          <p id="email-error" className="mt-1 text-sm text-red-700">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="min-h-11 w-full rounded-lg border px-3 py-2.5 pr-11"
            {...register('password')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 min-h-11 min-w-11 px-3"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff aria-hidden size={19} /> : <Eye aria-hidden size={19} />}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" className="mt-1 text-sm text-red-700">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      <button
        disabled={!isHydrated || isSubmitting}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" aria-hidden size={19} />
        ) : (
          <LogIn aria-hidden size={19} />
        )}
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
