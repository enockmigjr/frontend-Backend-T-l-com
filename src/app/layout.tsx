import type { Metadata } from 'next';
import { headers } from 'next/headers';
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await headers();
  return (
    <html lang="fr" className={cn(GeistSans.variable, GeistMono.variable, inter.variable, 'font-sans')}>
      <body>
        <nav aria-label="Accès rapide">
          <a
            href="#contenu"
            className="fixed left-3 top-3 z-50 -translate-y-20 rounded-md bg-white px-4 py-3 font-semibold shadow-lg focus:translate-y-0"
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
