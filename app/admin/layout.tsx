'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/admin/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'ADMIN' && profile.role !== 'AGENT') {
        router.push('/user');
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-finland-blue">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (profile.role !== 'ADMIN' && profile.role !== 'AGENT') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-finland-gray-light">
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
