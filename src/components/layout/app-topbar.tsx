'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CurrentUser } from '@/lib/auth/session';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NotificationMenu } from './notification-menu';
import { UserMenu } from './user-menu';

export function AppTopbar({ user }: Readonly<{ user: CurrentUser }>) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/tickets?search=${encodeURIComponent(value)}` : '/tickets');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-5">
      <SidebarTrigger className="size-9" />
      <form onSubmit={submit} className="relative hidden w-full max-w-xl md:block">
        <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="global-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un ticket, un client ou une référence…"
          className="h-10 bg-muted/45 pl-9 pr-16 shadow-none"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Ctrl K
        </kbd>
      </form>
      <Button
        variant="ghost"
        size="icon-lg"
        className="md:hidden"
        aria-label="Rechercher"
        onClick={() => router.push('/tickets')}
      >
        <Search aria-hidden />
      </Button>
      <div className="ml-auto flex items-center gap-1">
        <NotificationMenu />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
