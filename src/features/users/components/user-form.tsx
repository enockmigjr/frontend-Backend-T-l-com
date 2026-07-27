'use client';

import type { CreateUser, Department, UpdateUser, User } from '../api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';

const roles = [
  'CUSTOMER_SERVICE_AGENT',
  'NOC_ENGINEER',
  'BILLING_AGENT',
  'TECHNICAL_SUPPORT_ENGINEER',
  'FIELD_TECHNICIAN',
  'SUPERVISOR',
  'ADMINISTRATOR',
] as const;

export const roleLabels: Readonly<Record<(typeof roles)[number], string>> = {
  CUSTOMER_SERVICE_AGENT: 'Service client',
  NOC_ENGINEER: 'Ingénieur NOC',
  BILLING_AGENT: 'Facturation',
  TECHNICAL_SUPPORT_ENGINEER: 'Support technique',
  FIELD_TECHNICIAN: 'Technicien terrain',
  SUPERVISOR: 'Superviseur',
  ADMINISTRATOR: 'Administrateur',
};

export function UserForm({
  user,
  departments,
  pending,
  onSubmit,
}: Readonly<{
  user?: User;
  departments: readonly Department[];
  pending: boolean;
  onSubmit: (body: CreateUser | UpdateUser) => Promise<void>;
}>) {
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const values = {
          firstName: String(data.get('firstName')),
          lastName: String(data.get('lastName')),
          role: String(data.get('role')) as CreateUser['role'],
          departmentId: String(data.get('departmentId')),
        };
        void onSubmit(user ? values : { ...values, email: String(data.get('email')) });
      }}
    >
      <FormField label="Prénom" name="firstName" defaultValue={user?.firstName} />
      <FormField label="Nom" name="lastName" defaultValue={user?.lastName} />
      {!user ? <FormField label="E-mail professionnel" name="email" type="email" className="sm:col-span-2" /> : null}
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Rôle</span>
        <select name="role" defaultValue={user?.role} className="h-10 rounded-lg border bg-background px-3">
          {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Département</span>
        <select name="departmentId" defaultValue={user?.departmentId} className="h-10 rounded-lg border bg-background px-3" required>
          <option value="">Sélectionner…</option>
          {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
      </label>
      <DialogFooter className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Enregistrement…' : user ? 'Enregistrer les modifications' : 'Créer le compte'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function FormField(props: Readonly<{ label: string; name: string; type?: string; defaultValue?: string; className?: string }>) {
  return (
    <label className={`grid gap-1.5 text-sm ${props.className ?? ''}`}>
      <span className="font-medium">{props.label}</span>
      <Input required name={props.name} type={props.type} defaultValue={props.defaultValue} className="h-10" />
    </label>
  );
}
