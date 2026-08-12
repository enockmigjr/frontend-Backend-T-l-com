'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { login } from './api';
import { ErrorAlert } from './error-alert';
import { loginSchema, type LoginInput } from './schemas';
import { getCurrentUser } from '@/lib/auth/session';
import { authenticatedDestination, safeReturnPath } from './redirects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<unknown>();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const returnPath = safeReturnPath(searchParams.get('retour'));

  useEffect(() => {
    const controller = new AbortController();
    void getCurrentUser(controller.signal)
      .then((user) => router.replace(returnPath ?? authenticatedDestination(user.role)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [returnPath, router]);

  async function submit(values: LoginInput) {
    setError(undefined);
    try {
      const user = await login(values);
      const destination = returnPath ?? authenticatedDestination(user.role);
      router.replace(user.mustChangePassword ? `/change-password?retour=${encodeURIComponent(destination)}` : destination);
      router.refresh();
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
      {error ? <ErrorAlert error={error} /> : null}
      <div>
        <Label className="mb-2" htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="h-11"
          {...register('email')}
        />
        {errors.email ? (
          <p id="email-error" className="mt-1 text-sm text-red-700">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <Label className="mb-2" htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="h-11 pr-11"
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 size-11"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff aria-hidden size={19} /> : <Eye aria-hidden size={19} />}
          </Button>
        </div>
        {errors.password ? (
          <p id="password-error" className="mt-1 text-sm text-red-700">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full bg-blue-700 hover:bg-blue-800"
      >
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" aria-hidden size={19} />
        ) : (
          <LogIn aria-hidden size={19} />
        )}
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </Button>
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-emerald-500" />Connexion chiffrée et session protégée
      </p>
    </form>
  );
}
