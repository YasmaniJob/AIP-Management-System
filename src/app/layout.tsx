import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';
import { Poppins } from 'next/font/google';
import { getSystemSettings } from '@/lib/actions/settings';
import { DynamicFavicon } from '@/components/layout/dynamic-favicon';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  fallback: ['sans-serif'],
  adjustFontFallback: true
});

export async function generateMetadata(): Promise<Metadata> {
  let settings = null;
  
  try {
    settings = await getSystemSettings();
  } catch (error) {
    console.warn('Failed to fetch system settings for metadata, using defaults:', error);
    // Use default settings if fetch fails
    settings = {
      app_name: 'AIP Manager',
      app_logo_url: null
    };
  }
  
  return {
    title: settings?.app_name || 'AIP Manager',
    description: 'Sistema de Gestión para Aulas de Innovación Pedagógica',
    icons: {
      icon: settings?.app_logo_url || '/favicon.svg',
      apple: settings?.app_logo_url || '/icon.png',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${poppins.variable}`}>
      <body className="font-body antialiased">
        <AppProviders>
          <DynamicFavicon />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
