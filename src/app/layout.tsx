import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'KAMGOKO ITSM', template: '%s · KAMGOKO ITSM' },
  description: 'Console opérationnelle de gestion des incidents télécom',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101623' },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [headerValues, cookieStore] = await Promise.all([headers(), cookies()]);
  const themeCookie = cookieStore.get('theme')?.value;
  const systemDark = headerValues.get('sec-ch-prefers-color-scheme') === 'dark';
  const dark =
    themeCookie === 'dark' || ((themeCookie === 'system' || themeCookie === undefined) && systemDark);
  return (
    <html
      lang="fr"
      className={cn(GeistSans.variable, GeistMono.variable, inter.variable, 'font-sans', dark && 'dark')}
    >
      <body>
        <nav aria-label="Accès rapide">
          <a
            href="#contenu"
            className="fixed left-3 top-3 z-50 -translate-y-20 rounded-md bg-background px-4 py-3 font-semibold text-foreground shadow-lg focus:translate-y-0"
          >
            Aller au contenu
          </a>
        </nav>
        <TooltipProvider>
          <div className="isolate min-h-dvh">
            <Providers>{children}</Providers>
          </div>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
