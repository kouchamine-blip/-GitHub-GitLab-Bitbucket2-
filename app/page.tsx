'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        if (profile.role === 'ADMIN' || profile.role === 'AGENT') {
          router.push('/admin/dashboard');
        } else {
          router.push('/tarina');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-finland-blue">
      <div className="text-finland-white text-2xl">Loading...</div>
    </div>
  );
}
