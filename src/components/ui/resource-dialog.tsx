'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

export function ResourceDialog({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  size = 'default',
}: Readonly<{
  trigger?: React.ReactElement;
  title: string;
  description?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'default' | 'large' | 'wide';
}>) {
  const sizeClass = {
    default: 'sm:max-w-lg',
    large: 'sm:max-w-2xl',
    wide: 'sm:max-w-4xl',
  }[size];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className={`${sizeClass} max-h-[calc(100dvh-2rem)] overflow-hidden`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto overscroll-contain pr-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
