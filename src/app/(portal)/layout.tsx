import { AppShell } from '@/components/layout/app-shell';
import { cookies } from 'next/headers';

export default async function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  return <AppShell sidebarDefaultOpen={store.get('sidebar_state')?.value !== 'false'}>{children}</AppShell>;
}
