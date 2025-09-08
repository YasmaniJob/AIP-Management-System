'use client';

import { ThemeProvider } from 'next-themes';
import { ConfigProvider } from '@/contexts/config-context';
import { Toaster } from '@/components/ui/toaster';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <ConfigProvider>
        {children}
        <Toaster />
      </ConfigProvider>
    </ThemeProvider>
  );
}