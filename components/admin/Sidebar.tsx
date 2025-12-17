'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  Package,
  Receipt,
  Store,
  Wallet,
  Users,
  LogOut,
  Globe,
  Activity,
  UserCheck
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const { signOut, profile } = useAuth();

  const menuItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/admin/products', icon: Package, label: t('products') },
    { href: '/admin/transactions', icon: Receipt, label: t('transactions') },
    { href: '/admin/store', icon: Store, label: t('store') },
    { href: '/admin/finance', icon: Wallet, label: t('finance') },
    ...(profile?.role === 'ADMIN' ? [
      { href: '/admin/users', icon: Users, label: t('users') },
      { href: '/admin/subscriptions', icon: UserCheck, label: 'Subscriptions' },
      { href: '/admin/logs', icon: Activity, label: 'Logs' }
    ] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="w-64 bg-finland-blue text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-finland-blue-light">
        <h1 className="text-2xl font-bold">ORUS</h1>
        <p className="text-sm text-gray-300 mt-1">{profile?.full_name}</p>
        <p className="text-xs text-gray-400">{profile?.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-white text-finland-blue'
                  : 'text-white hover:bg-finland-blue-light'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-finland-blue-light space-y-2">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setLocale('en')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              locale === 'en'
                ? 'bg-white text-finland-blue'
                : 'bg-finland-blue-light text-white hover:bg-white hover:text-finland-blue'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-1" />
            EN
          </button>
          <button
            onClick={() => setLocale('fi')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              locale === 'fi'
                ? 'bg-white text-finland-blue'
                : 'bg-finland-blue-light text-white hover:bg-white hover:text-finland-blue'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-1" />
            FI
          </button>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
