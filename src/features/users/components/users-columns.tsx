import { Eye, Power, UserPen } from 'lucide-react';
import type { User } from '../api/types';
import { roleLabels } from './user-form';
import { Badge } from '@/components/ui/badge';
import type { DataColumn } from '@/components/ui/data-table';
import { RowActionMenu } from '@/components/ui/row-action-menu';

export function userColumns({
  isAdministrator,
  pending,
  onSelect,
  onEdit,
  onToggle,
}: Readonly<{
  isAdministrator: boolean;
  pending: boolean;
  onSelect: (user: User) => void;
  onEdit: (user: User) => void;
  onToggle: (user: User) => void;
}>): readonly DataColumn<User>[] {
  return [
    {
      key: 'name',
      label: 'Collaborateur',
      sortValue: (user) => `${user.lastName} ${user.firstName}`,
      cell: (user) => (
        <div>
          <strong>
            {user.firstName} {user.lastName}
          </strong>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    { key: 'role', label: 'Rôle', sortValue: (user) => user.role, cell: (user) => roleLabels[user.role] },
    {
      key: 'department',
      label: 'Département',
      sortValue: (user) => user.departmentName,
      cell: (user) => user.departmentName ?? 'Non renseigné',
    },
    {
      key: 'status',
      label: 'État',
      sortValue: (user) => Number(user.isActive),
      cell: (user) => (
        <Badge variant={user.isActive ? 'secondary' : 'outline'}>{user.isActive ? 'Actif' : 'Désactivé'}</Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      cell: (user) => (
        <RowActionMenu
          label={`Actions pour ${user.firstName} ${user.lastName}`}
          actions={[
            { label: 'Voir', icon: Eye, onSelect: () => onSelect(user) },
            { label: 'Modifier', icon: UserPen, onSelect: () => onEdit(user) },
            {
              label: user.isActive ? 'Désactiver' : 'Activer',
              icon: Power,
              disabled: !isAdministrator || pending,
              destructive: user.isActive,
              onSelect: () => onToggle(user),
            },
          ]}
        />
      ),
    },
  ];
}
