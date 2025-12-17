'use client';

import { LocaleProvider } from '@/i18n/LocaleContext';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
