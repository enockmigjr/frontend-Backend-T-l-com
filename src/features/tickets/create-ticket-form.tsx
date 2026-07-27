'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, ClipboardPlus, LoaderCircle, RadioTower, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Panel } from '@/components/ui/panel';
import { Textarea } from '@/components/ui/textarea';
import { ErrorAlert } from '@/features/auth/error-alert';
import { ticketsApi } from './api';
import { FormField, priorities, SectionHeader, selectClass, SelectField, severities, Summary } from './create-ticket-fields';
import { createTicketSchema, type CreateTicketInput } from './schemas';
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
  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { priority: 'MEDIUM', severity: 'S3' },
  });
  const values = form.watch();
  const teamName = references.data?.departments.find((item) => item.id === values.assignedTeamId)?.name;
  const departmentName = references.data?.departments.find((item) => item.id === values.departmentId)?.name;
  if (references.isPending)
    return <Panel className="h-80 animate-pulse bg-muted/40" role="status" aria-label="Chargement du formulaire" />;
  if (references.error) return <ErrorAlert error={references.error} />;
  return (
    <form
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]"
      onSubmit={form.handleSubmit((value) => create.mutate(value))}
      noValidate
    >
      <div className="space-y-5">
        {create.error ? <ErrorAlert error={create.error} /> : null}
        <Panel className="overflow-hidden">
          <SectionHeader
            icon={ClipboardPlus}
            title="Incident"
            description="Décrivez clairement le problème observé et son impact."
          />
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <FormField
              className="md:col-span-2"
              label="Titre de l’incident"
              error={form.formState.errors.title?.message}
            >
              <Input
                autoFocus
                placeholder="Ex. Coupure fibre sur le site de Cotonou"
                aria-invalid={Boolean(form.formState.errors.title)}
                {...form.register('title')}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              label="Description détaillée"
              error={form.formState.errors.description?.message}
            >
              <Textarea
                rows={6}
                placeholder="Symptômes, heure de début, services touchés et vérifications déjà effectuées…"
                aria-invalid={Boolean(form.formState.errors.description)}
                {...form.register('description')}
              />
            </FormField>
            <SelectField label="Priorité" error={form.formState.errors.priority?.message}>
              <select className={selectClass} {...form.register('priority')}>
                {priorities.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </SelectField>
            <SelectField label="Sévérité" error={form.formState.errors.severity?.message}>
              <select className={selectClass} {...form.register('severity')}>
                {severities.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </SelectField>
            <SelectField label="Catégorie" error={form.formState.errors.categoryId?.message}>
              <select className={selectClass} defaultValue="" {...form.register('categoryId')}>
                <option value="" disabled>
                  Sélectionner une catégorie
                </option>
                {references.data?.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </SelectField>
            <FormField label="Tags" error={form.formState.errors.tags?.message}>
              <Input placeholder="fibre, nord, entreprise" {...form.register('tags')} />
            </FormField>
          </div>
        </Panel>
        <Panel className="overflow-hidden">
          <SectionHeader
            icon={Building2}
            title="Routage opérationnel"
            description="Définissez le propriétaire et l’équipe qui traitera l’incident."
          />
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <SelectField label="Département propriétaire" error={form.formState.errors.departmentId?.message}>
              <select className={selectClass} defaultValue="" {...form.register('departmentId')}>
                <option value="" disabled>
                  Sélectionner un département
                </option>
                {references.data?.departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </SelectField>
            <SelectField label="Équipe assignée" error={form.formState.errors.assignedTeamId?.message}>
              <select className={selectClass} defaultValue="" {...form.register('assignedTeamId')}>
                <option value="" disabled>
                  Sélectionner l’équipe responsable
                </option>
                {references.data?.departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </SelectField>
          </div>
        </Panel>
        <Panel className="overflow-hidden">
          <SectionHeader
            icon={UserRound}
            title="Client concerné"
            description="Informations facultatives utiles au suivi et au rappel."
          />
          <div className="grid gap-5 p-5 md:grid-cols-3">
            <FormField label="Nom du client">
              <Input {...form.register('customerName')} />
            </FormField>
            <FormField label="N° de compte">
              <Input {...form.register('customerAccountNumber')} />
            </FormField>
            <FormField label="Contact">
              <Input {...form.register('customerContact')} />
            </FormField>
          </div>
        </Panel>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? <LoaderCircle className="animate-spin" /> : null}
            {create.isPending ? 'Création…' : 'Créer le ticket'}
          </Button>
        </div>
      </div>
      <Panel className="sticky top-20 p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <RadioTower className="size-4 text-primary" />
          Résumé du routage
        </h2>
        <dl className="mt-4 space-y-4 text-sm">
          <Summary label="Département" value={departmentName} />
          <Summary label="Équipe assignée" value={teamName} />
          <Summary label="Priorité" value={priorities.find(([value]) => value === values.priority)?.[1]} />
          <Summary label="Sévérité" value={values.severity} />
        </dl>
        <p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">
          Le SLA sera calculé automatiquement selon la priorité, la catégorie et les politiques actives.
        </p>
      </Panel>
    </form>
  );
}
