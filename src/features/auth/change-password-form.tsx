'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { changePassword } from './api';
import { ErrorAlert } from './error-alert';
import { changePasswordSchema, type ChangePasswordInput } from './schemas';

export function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<unknown>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  async function submit(values: ChangePasswordInput) {
    setError(undefined);
    try {
      await changePassword(values);
      router.replace('/tickets');
      router.refresh();
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
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
            <label className="mb-1.5 block text-sm font-medium" htmlFor={name}>
              {labels[name]}
            </label>
            <input
              id={name}
              type="password"
              autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? errorId : undefined}
              className="min-h-11 w-full rounded-lg border px-3 py-2.5"
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
      <p className="text-xs text-slate-600">
        8 caractères minimum avec majuscule, minuscule, chiffre et caractère spécial.
      </p>
      <button
        disabled={isSubmitting}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" aria-hidden size={19} />
        ) : (
          <ShieldCheck aria-hidden size={19} />
        )}
        {isSubmitting ? 'Mise à jour…' : 'Mettre à jour'}
      </button>
    </form>
  );
}
