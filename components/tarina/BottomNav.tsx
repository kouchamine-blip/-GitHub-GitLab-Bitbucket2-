'use client';

import { useEffect, useState } from 'react';
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCounts = async () => {
      try {
        const { count: messagesCount } = await supabase
          .from('orus_messages')
          .select('*', { count: 'exact', head: true })
          .eq('read', false)
          .neq('sender_id', user.id);

        const { count: notificationsCount } = await supabase
          .from('orus_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        setUnreadCount((messagesCount || 0) + (notificationsCount || 0));
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();

    const interval = setInterval(fetchUnreadCounts, 30000);

    const messagesChannel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orus_messages',
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orus_notifications',
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user]);

  const navItems = [
    { href: '/tarina', icon: Home, label: t('home') },
    { href: '/tarina/find', icon: Search, label: t('find') },
    { href: '/tarina/sell', icon: PlusSquare, label: t('sell') },
    { href: '/tarina/chat', icon: MessageCircle, label: t('chat'), badge: unreadCount > 0 ? unreadCount : undefined },
    { href: '/tarina/profile', icon: User, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-tarina-cream dark:bg-gray-800 border-t border-tarina-beige dark:border-gray-700 z-50 shadow-2xl">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 mb-1 transition-colors ${
                    isActive
                      ? 'text-tarina-orange dark:text-tarina-amber stroke-[2.5]'
                      : 'text-tarina-brown-light dark:text-gray-500'
                  }`}
                />
                {item.badge && item.badge > 0 && (
                  <div className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </div>
                )}
              </div>
              <span
                className={`text-xs transition-colors ${
                  isActive
                    ? 'text-tarina-orange dark:text-tarina-amber font-semibold'
                    : 'text-tarina-brown-light dark:text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
