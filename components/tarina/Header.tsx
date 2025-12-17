'use client';

import { Moon, Sun, User, Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Locale } from '@/i18n/translations';
import { NotificationDropdown } from './NotificationDropdown';

export function TarinaHeader() {
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [showMainMenu, setShowMainMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const languages: { code: Locale; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  ];

  const currentLang = languages.find(l => l.code === locale) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMainMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/tarina/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-tarina-offwhite dark:bg-gray-800 border-b border-tarina-beige-light dark:border-gray-700 z-40 shadow-sm">
      <div className="flex items-center justify-between h-16 max-w-screen-xl mx-auto px-4">
        <div className="flex items-center space-x-3 relative" ref={menuRef}>
          <button
            onClick={() => setShowMainMenu(!showMainMenu)}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
              <Image
                src="/image copy.png"
                alt="Tarina Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-tarina-brown dark:text-tarina-amber tracking-tight">
                Tarina
              </h1>
              {pathname === '/tarina' && (
                <p className="text-xs text-tarina-brown-light dark:text-gray-400 uppercase tracking-wide">
                  {t('tarinaTagline')}
                </p>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-tarina-brown dark:text-tarina-amber transition-transform ${showMainMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMainMenu && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-tarina-cream dark:bg-gray-800 rounded-xl shadow-xl border border-tarina-beige dark:border-gray-700 overflow-hidden">
              <div className="py-2">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-tarina-beige-light dark:hover:bg-gray-700 transition-colors"
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5 text-tarina-brown dark:text-gray-300" />
                  ) : (
                    <Sun className="w-5 h-5 text-tarina-brown dark:text-gray-300" />
                  )}
                  <span className="text-sm font-medium text-tarina-brown dark:text-gray-100">
                    {t('theme')}: {theme === 'light' ? 'Light' : 'Dark'}
                  </span>
                </button>

                <div className="border-t border-tarina-beige-light dark:border-gray-700 my-1" />

                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-tarina-brown-light dark:text-gray-400 uppercase tracking-wide mb-2">
                    {t('language')}
                  </p>
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLocale(lang.code);
                      }}
                      className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-tarina-beige-light dark:hover:bg-gray-700 transition-colors ${
                        locale === lang.code ? 'bg-tarina-beige dark:bg-gray-750' : ''
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm font-medium text-tarina-brown dark:text-gray-100">
                        {lang.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-tarina-beige-light dark:border-gray-700 my-1" />

                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    router.push('/tarina/profile');
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-tarina-beige-light dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="w-5 h-5 text-tarina-brown dark:text-gray-300" />
                  <span className="text-sm font-medium text-tarina-brown dark:text-gray-100">
                    {t('profile')}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    router.push('/tarina/profile');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-tarina-beige-light dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5 text-tarina-brown dark:text-gray-300" />
                    <span className="text-sm font-medium text-tarina-brown dark:text-gray-100">
                      {t('balance')}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-tarina-amber">
                    {profile?.wallet_balance?.toFixed(2) || '0.00'} €
                  </span>
                </button>

                <div className="border-t border-tarina-beige-light dark:border-gray-700 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {t('logout')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <NotificationDropdown />
      </div>
    </header>
  );
}
