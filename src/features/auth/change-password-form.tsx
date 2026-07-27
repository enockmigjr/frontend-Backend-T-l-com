'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, LoaderCircle, LogOut, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { changePassword } from './api';
import { ErrorAlert } from './error-alert';
import { changePasswordSchema, type ChangePasswordInput } from './schemas';
import { getCurrentUser } from '@/lib/auth/session';
import { authenticatedDestination, safeReturnPath } from './redirects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from './use-current-user';
import { useSessionActions } from './use-session-actions';

export function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<unknown>();
  const currentUser = useCurrentUser();
  const session = useSessionActions();
  const mustLeaveSession = currentUser.isError || currentUser.data?.mustChangePassword;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  async function submit(values: ChangePasswordInput) {
    setError(undefined);
    try {
      await changePassword(values);
      const user = await getCurrentUser();
      router.replace(safeReturnPath(searchParams.get('retour')) ?? authenticatedDestination(user.role));
      router.refresh();
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <Button
        type="button"
        variant="ghost"
        className="-ml-2"
        disabled={currentUser.isPending || session.pending}
        onClick={() => {
          if (mustLeaveSession) void session.logout(false);
          else router.push(safeReturnPath(searchParams.get('retour')) ?? '/settings');
        }}
      >
        {mustLeaveSession ? <LogOut /> : <ArrowLeft />}
        {currentUser.isPending
          ? 'Vérification…'
          : mustLeaveSession
            ? 'Annuler et se déconnecter'
            : 'Retour aux paramètres'}
      </Button>
      {error ? <ErrorAlert error={error} /> : null}
      {(['currentPassword', 'newPassword', 'confirmation'] as const).map((name) => {
        const labels = {
          currentPassword: 'Mot de passe actuel',
          newPassword: 'Nouveau mot de passe',
          confirmation: 'Confirmer le nouveau mot de passe',
        };
        const errorId = `${name}-error`;
        return (
          <div key={name}>
            <Label className="mb-2" htmlFor={name}>{labels[name]}</Label>
            <Input
              id={name}
              type="password"
              autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? errorId : undefined}
              className="h-11"
              {...register(name)}
            />
            {errors[name] ? (
              <p id={errorId} className="mt-1 text-sm text-red-700">
                {errors[name]?.message}
              </p>
            ) : null}
          </div>
        );
      })}
      <div className="rounded-lg border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
        8 caractères minimum · une majuscule · une minuscule · un chiffre · un caractère spécial
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
          <ShieldCheck aria-hidden size={19} />
        )}
        {isSubmitting ? 'Mise à jour…' : 'Mettre à jour'}
      </Button>
    </form>
  );
}
