'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, ShoppingBag, Heart, TrendingDown, MessageSquare, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  product_id?: string;
  data?: any;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.read).length || 0);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      await fetchNotifications();
    }
    setLoading(false);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.product_id) {
      router.push(`/tarina/product/${notification.product_id}`);
      setShowDropdown(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'YOUR_PRODUCT_SOLD':
        return <ShoppingBag className="w-5 h-5 text-green-500" />;
      case 'PRODUCT_SOLD':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'PRICE_CHANGE':
        return <TrendingDown className="w-5 h-5 text-blue-500" />;
      case 'OFFER_RECEIVED':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative w-10 h-10 rounded-full bg-tarina-beige-light dark:bg-gray-700 flex items-center justify-center hover:bg-tarina-beige dark:hover:bg-gray-600 transition-colors shadow-sm"
        aria-label={t('notifications')}
      >
        <Bell className="w-5 h-5 text-tarina-brown dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-tarina-cream dark:bg-gray-800 rounded-xl shadow-xl border border-tarina-beige dark:border-gray-700 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-tarina-beige-light dark:border-gray-700">
            <h3 className="font-semibold text-tarina-brown dark:text-gray-100">
              {t('notifications')}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-tarina-amber hover:text-tarina-amber-dark font-medium disabled:opacity-50"
              >
                {t('markAllAsRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('noNotifications')}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full flex items-start space-x-3 px-4 py-3 hover:bg-tarina-beige-light dark:hover:bg-gray-700 transition-colors border-b border-tarina-beige-light dark:border-gray-700 last:border-b-0 ${
                    !notification.read ? 'bg-tarina-beige/30 dark:bg-gray-700/30' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-tarina-brown dark:text-gray-100 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-tarina-brown-light dark:text-gray-500 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-tarina-amber rounded-full"></div>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
