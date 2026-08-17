import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Brand({
  className,
  compact = false,
  textClassName,
  onClick,
}: Readonly<{ className?: string; compact?: boolean; textClassName?: string; onClick?: () => void }>) {
  return (
    <Link
      href="/tickets"
      aria-label={compact ? 'KAMGOKO ITSM' : undefined}
      onClick={onClick}
      className={cn('flex items-center gap-2 overflow-hidden rounded-lg', className)}
    >
      <Image
        src="/logo.png"
        alt="Logo KAMGOKO"
        width={32}
        height={32}
        priority
        unoptimized
        className="size-8 shrink-0 rounded-lg object-cover shadow-sm"
      />
      {!compact ? (
        <span className={cn('min-w-0', textClassName)}>
          <strong className="block truncate text-sm tracking-tight">KAMGOKO ITSM</strong>
          <span className="block truncate text-[11px] text-muted-foreground">Console opérationnelle</span>
        </span>
      ) : null}
    </Link>
  );
}
