import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.soluciondesalud.cl'),
  title: {
    default: 'Solucion De Salud - Comparador de Planes de Salud',
    template: '%s | Solucion De Salud',
  },
  description: 'Compara planes de salud de las principales Isapres de Chile. Plataforma 100% gratuita para cotizar y solicitar planes de salud.',
  keywords: ['planes de salud', 'isapres', 'comparador', 'cotizador', 'seguros de salud', 'Chile'],
  authors: [{ name: 'Solucion De Salud' }],
  creator: 'Solucion De Salud',
  publisher: 'Solucion De Salud',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://www.soluciondesalud.cl',
    siteName: 'Solucion De Salud',
    title: 'Solucion De Salud - Comparador de Planes de Salud',
    description: 'Compara planes de salud de las principales Isapres de Chile. Plataforma 100% gratuita.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solucion De Salud - Comparador de Planes de Salud',
    description: 'Compara planes de salud de las principales Isapres de Chile. Plataforma 100% gratuita.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.soluciondesalud.cl',
  },
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

