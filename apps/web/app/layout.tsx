import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QuePlan - Comparador de Planes de Salud',
  description: 'Compara planes de salud de las principales Isapres de Chile',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <SiteHeader />
          <main className="min-h-screen">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

