'use client';

import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

export interface RowAction {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly onSelect: () => void;
  readonly disabled?: boolean;
  readonly destructive?: boolean;
}

export function RowActionMenu({ label, actions }: Readonly<{ label: string; actions: readonly RowAction[] }>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="ghost" size="icon" aria-label={label} />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {actions.map(({ label: itemLabel, icon: Icon, onSelect, disabled, destructive }) => (
          <DropdownMenuItem
            key={itemLabel}
            disabled={disabled}
            variant={destructive ? 'destructive' : 'default'}
            onClick={onSelect}
          >
            <Icon />{itemLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
