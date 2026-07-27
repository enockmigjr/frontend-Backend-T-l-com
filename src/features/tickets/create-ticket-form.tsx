'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi } from './api';
import { createTicketSchema, type CreateTicketInput } from './schemas';

const priorities = [
  ['LOW', 'Basse'],
  ['MEDIUM', 'Moyenne'],
  ['HIGH', 'Haute'],
  ['CRITICAL', 'Critique'],
] as const;
const severities = [
  ['S1', 'S1 — Impact critique'],
  ['S2', 'S2 — Impact majeur'],
  ['S3', 'S3 — Impact modéré'],
  ['S4', 'S4 — Impact faible'],
] as const;

export function CreateTicketForm() {
  const router = useRouter();
  const idempotencyKey = useRef(crypto.randomUUID());
  const references = useQuery({
    queryKey: ['ticket-references'],
    queryFn: async () => {
      const [categories, departments] = await Promise.all([ticketsApi.categories(), ticketsApi.departments()]);
      return { categories, departments };
    },
  });
  const create = useMutation({
    mutationFn: (input: CreateTicketInput) => ticketsApi.create(input, idempotencyKey.current),
    onSuccess: (ticket) => router.push(`/tickets/${ticket.id}`),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { priority: 'MEDIUM', severity: 'S3' },
  });
  const field = 'min-h-11 w-full rounded-lg border px-3 py-2.5';

  if (references.isPending)
    return (
      <div role="status" className="rounded-xl border bg-white p-8">
        Chargement du formulaire…
      </div>
    );
  if (references.error) return <ErrorAlert error={references.error} />;

  return (
    <form
      className="space-y-6 rounded-xl border bg-white p-5"
      onSubmit={handleSubmit((value) => create.mutate(value))}
      noValidate
    >
      {create.error ? <ErrorAlert error={create.error} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block font-medium" htmlFor="title">
            Titre de l’incident
          </label>
          <input id="title" className={field} autoFocus aria-invalid={Boolean(errors.title)} {...register('title')} />
          {errors.title ? <p className="mt-1 text-sm text-red-700">{errors.title.message}</p> : null}
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block font-medium" htmlFor="description">
            Description détaillée
          </label>
          <textarea
            id="description"
            rows={5}
            className={field}
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
          {errors.description ? <p className="mt-1 text-sm text-red-700">{errors.description.message}</p> : null}
        </div>
        <SelectField id="priority" label="Priorité" error={errors.priority?.message}>
          <select id="priority" className={field} {...register('priority')}>
            {priorities.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </SelectField>
        <SelectField id="severity" label="Sévérité" error={errors.severity?.message}>
          <select id="severity" className={field} {...register('severity')}>
            {severities.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </SelectField>
        <SelectField id="categoryId" label="Catégorie" error={errors.categoryId?.message}>
          <select id="categoryId" className={field} defaultValue="" {...register('categoryId')}>
            <option value="" disabled>
              Sélectionner
            </option>
            {references.data?.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </SelectField>
        <SelectField id="departmentId" label="Département propriétaire" error={errors.departmentId?.message}>
          <select id="departmentId" className={field} defaultValue="" {...register('departmentId')}>
            <option value="" disabled>
              Sélectionner
            </option>
            {references.data?.departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </SelectField>
        <SelectField id="assignedTeamId" label="Équipe assignée" error={errors.assignedTeamId?.message}>
          <select id="assignedTeamId" className={field} defaultValue="" {...register('assignedTeamId')}>
            <option value="" disabled>
              Sélectionner
            </option>
            {references.data?.departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </SelectField>
        <div>
          <label className="mb-1 block font-medium" htmlFor="tags">
            Tags
          </label>
          <input id="tags" className={field} placeholder="fibre, nord, entreprise" {...register('tags')} />
        </div>
      </div>
      <fieldset className="grid gap-5 border-t pt-5 md:grid-cols-3">
        <legend className="px-1 font-semibold">Client (facultatif)</legend>
        <div>
          <label className="mb-1 block text-sm" htmlFor="customerName">
            Nom
          </label>
          <input id="customerName" className={field} {...register('customerName')} />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="customerAccountNumber">
            N° de compte
          </label>
          <input id="customerAccountNumber" className={field} {...register('customerAccountNumber')} />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="customerContact">
            Contact
          </label>
          <input id="customerContact" className={field} {...register('customerContact')} />
        </div>
      </fieldset>
      <div className="flex justify-end gap-3">
        <button type="button" className="min-h-11 rounded-lg border px-4 py-2" onClick={() => router.back()}>
          Annuler
        </button>
        <button
          disabled={create.isPending}
          className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {create.isPending ? <LoaderCircle className="animate-spin" aria-hidden size={18} /> : null}
          {create.isPending ? 'Création…' : 'Créer le ticket'}
        </button>
      </div>
    </form>
  );
}

function SelectField({
  id,
  label,
  error,
  children,
}: Readonly<{ id: string; label: string; error?: string; children: React.ReactNode }>) {
  return (
    <div>
      <label className="mb-1 block font-medium" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
