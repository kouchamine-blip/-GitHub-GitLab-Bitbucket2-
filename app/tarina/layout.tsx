'use client';

import { TarinaHeader } from '@/components/tarina/Header';
import { BottomNav } from '@/components/tarina/BottomNav';
import { usePathname } from 'next/navigation';

export default function TarinaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = pathname === '/tarina/login' || pathname === '/tarina/signup';
  const showHeader = pathname === '/tarina';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {showHeader && <TarinaHeader />}
      <main className={`${showHeader ? 'pt-16' : ''} ${!hideNav ? 'pb-20' : ''} min-h-screen`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
